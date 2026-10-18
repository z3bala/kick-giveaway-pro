import crypto from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { dbOps } from '../db.js';
import type { KickBotService, InboundChatMessage } from './kickBot.js';
import type { GtbEvent, GtbGuess, GtbStatePayload } from '../../shared/types.js';

export interface GtbBroadcaster {
  emitEvent: (event: string, data: any) => void;
}

export class GtbService {
  private activeEvent: GtbEvent | null = null;
  private guesses: GtbGuess[] = [];
  private lastJoinNotificationTime = 0;

  constructor(
    private db: DatabaseSync,
    private kickBot: KickBotService,
    private broadcaster: GtbBroadcaster
  ) {
    this.initFromDatabase();
  }

  private initFromDatabase(): void {
    // Load current active or latest event
    this.activeEvent = dbOps.getActiveGtbEvent(this.db) || dbOps.getLatestGtbEvent(this.db);
    if (this.activeEvent) {
      this.guesses = dbOps.getGtbGuesses(this.db, this.activeEvent.id);
      this.activeEvent.guessCount = this.guesses.length;
    }
  }

  public getActiveEvent(): GtbEvent | null {
    return this.activeEvent;
  }

  public getGuesses(eventId?: string): GtbGuess[] {
    const id = eventId || this.activeEvent?.id;
    if (!id) return [];
    if (this.activeEvent && id === this.activeEvent.id) {
      return this.guesses;
    }
    return dbOps.getGtbGuesses(this.db, id);
  }

  public getStateSnapshot(): GtbStatePayload {
    const active = this.activeEvent;
    const guesses = active ? this.guesses : [];
    const recent = dbOps.getRecentGtbEvents(this.db, 5);
    return {
      activeEvent: active,
      guesses,
      recentEvents: recent,
    };
  }

  /**
   * Create and open a new Guess The Balance event
   */
  public createEvent(title: string, prize: string, keyword: string = '!gtb'): GtbEvent {
    // If an event is currently open, close or complete it cleanly
    if (this.activeEvent && this.activeEvent.status === 'open') {
      this.closeEvent(this.activeEvent.id);
    }

    const now = new Date().toISOString();
    const id = `gtb-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const cleanKeyword = keyword.trim().toLowerCase().startsWith('!')
      ? keyword.trim().toLowerCase()
      : `!${keyword.trim().toLowerCase()}`;

    const newEvent = dbOps.createGtbEvent(this.db, {
      id,
      title: title.trim(),
      prize: prize.trim(),
      keyword: cleanKeyword,
      status: 'open',
      finalBalance: null,
      winnerId: null,
      winnerUsername: null,
      winnerGuess: null,
      winnerDiff: null,
      createdAt: now,
      closedAt: null,
      resolvedAt: null,
    });

    this.activeEvent = newEvent;
    this.guesses = [];

    this.broadcaster.emitEvent('gtb.created', newEvent);
    this.kickBot.queueChatReply(
      `🎰 GUESS THE BALANCE IS OPEN! Viewers, guess the final balance I will finish with on Stake.com! Type ${cleanKeyword} <amount> in chat (e.g. ${cleanKeyword} 260) to enter! Prize: ${prize}`
    );

    return newEvent;
  }

  /**
   * Close entries so viewers cannot alter or submit guesses before final balance
   */
  public closeEvent(eventId?: string): GtbEvent {
    const id = eventId || this.activeEvent?.id;
    if (!id) {
      throw new Error('No active Guess The Balance event found to close.');
    }

    const now = new Date().toISOString();
    dbOps.updateGtbEventStatus(this.db, id, 'closed', { closedAt: now });

    if (this.activeEvent && this.activeEvent.id === id) {
      this.activeEvent.status = 'closed';
      this.activeEvent.closedAt = now;
    } else {
      this.activeEvent = dbOps.getGtbEventById(this.db, id);
    }

    this.broadcaster.emitEvent('gtb.closed', this.activeEvent);
    this.kickBot.queueChatReply(
      `🔒 GUESS THE BALANCE IS NOW CLOSED! All viewer predictions are locked in (${this.guesses.length} total guesses). Best of luck!`
    );

    return this.activeEvent!;
  }

  /**
   * Process incoming chat message for !gtb <amount> pattern
   */
  public handleChatMessage(msg: InboundChatMessage): boolean {
    if (!this.activeEvent || this.activeEvent.status !== 'open') {
      return false;
    }

    const content = (msg.content || '').trim();
    if (!content) return false;

    // Pattern matching: !gtb 260, !gtb 150.50, !gtb $260, !gtb 260$, etc.
    const match = content.match(/^(![a-zA-Z0-9_-]+)\s+[$€£]?\s*([0-9]+(?:\.[0-9]+)?)\s*[$€£]?$/i);
    if (!match) return false;

    const cmd = match[1].toLowerCase();
    const eventKeyword = this.activeEvent.keyword.toLowerCase();

    if (cmd !== eventKeyword) {
      return false;
    }

    const guessVal = parseFloat(match[2]);
    if (isNaN(guessVal) || guessVal < 0) {
      return false;
    }

    const savedGuess = this.recordGuess(msg.username, guessVal, msg.userId, msg.timestamp);

    // Throttled chat acknowledgement so chat stays clean
    const currentMs = Date.now();
    if (currentMs - this.lastJoinNotificationTime > 2500) {
      this.lastJoinNotificationTime = currentMs;
      this.kickBot.queueChatReply(
        `🎯 @${savedGuess.username}, your Stake balance guess of $${guessVal.toFixed(2)} is locked in! (${this.guesses.length} total predictions)`
      );
    }

    return true;
  }

  /**
   * Directly record or update a viewer guess
   */
  public recordGuess(
    username: string,
    guessVal: number,
    userId?: string,
    customTimestamp?: string
  ): GtbGuess {
    if (!this.activeEvent || this.activeEvent.status !== 'open') {
      throw new Error('No open Guess The Balance event.');
    }

    if (isNaN(guessVal) || guessVal < 0) {
      throw new Error('Invalid guess value.');
    }

    const rawUsername = (username || 'kick_viewer').trim();
    const cleanUsername = rawUsername.replace(/[\x00-\x1F\x7F]/g, '').trim() || 'kick_viewer';
    let effectiveUserId = (userId || '').trim();
    if (!effectiveUserId || effectiveUserId === 'unknown' || effectiveUserId === 'undefined') {
      effectiveUserId = `user_${cleanUsername.toLowerCase()}`;
    }

    const now = customTimestamp || new Date().toISOString();
    const guessId = `guess-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    const newGuess: GtbGuess = {
      id: guessId,
      eventId: this.activeEvent.id,
      kickUserId: effectiveUserId,
      username: cleanUsername,
      guess: guessVal,
      createdAt: now,
      updatedAt: now,
    };

    const { isNew, guess: savedGuess } = dbOps.upsertGtbGuess(this.db, newGuess);

    if (isNew) {
      this.guesses.push(savedGuess);
      this.activeEvent.guessCount = this.guesses.length;
    } else {
      const idx = this.guesses.findIndex((g) => g.kickUserId === effectiveUserId);
      if (idx !== -1) {
        this.guesses[idx] = savedGuess;
      } else {
        this.guesses.push(savedGuess);
      }
    }

    this.broadcaster.emitEvent('gtb.guessAdded', {
      guess: savedGuess,
      isNew,
      totalGuesses: this.guesses.length,
      event: this.activeEvent,
    });

    return savedGuess;
  }

  /**
   * Streamer clicks "Closest Prediction":
   * Calculates absolute difference for all viewer guesses, chooses the closest guess,
   * updates the event to resolved, and announces the winner!
   */
  public resolveClosestPrediction(finalBalance: number, eventId?: string): {
    winner: GtbGuess;
    finalBalance: number;
    rankedGuesses: GtbGuess[];
    event: GtbEvent;
  } {
    const id = eventId || this.activeEvent?.id;
    if (!id) {
      throw new Error('No active Guess The Balance event to resolve.');
    }

    const allGuesses = this.getGuesses(id);
    if (!allGuesses || allGuesses.length === 0) {
      throw new Error('Cannot resolve: No viewer predictions were placed for this event.');
    }

    // Rank all guesses by absolute difference: Math.abs(guess - finalBalance)
    // Tie-breaker: earliest updatedAt (first person who locked that guess wins!)
    const ranked = allGuesses
      .map((g) => {
        const diff = Math.abs(g.guess - finalBalance);
        return {
          ...g,
          diff: Math.round(diff * 100) / 100,
        };
      })
      .sort((a, b) => {
        if (a.diff !== b.diff) {
          return a.diff - b.diff;
        }
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      });

    const winner = ranked[0];

    // Persist resolution to DB
    dbOps.resolveGtbEvent(
      this.db,
      id,
      finalBalance,
      winner.id,
      winner.username,
      winner.guess,
      winner.diff || 0
    );

    const updatedEvent = dbOps.getGtbEventById(this.db, id)!;
    this.activeEvent = updatedEvent;
    this.guesses = ranked;

    // Broadcast resolved event with winner details to Dashboard & OBS Overlay
    this.broadcaster.emitEvent('gtb.resolved', {
      event: updatedEvent,
      winner,
      finalBalance,
      topGuesses: ranked.slice(0, 10),
    });

    // Announce official winner in Kick live chat!
    const formattedBalance = finalBalance.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const formattedGuess = winner.guess.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const formattedDiff = (winner.diff || 0).toFixed(2);

    this.kickBot.queueChatReply(
      `🏆 GUESS THE BALANCE RESULT! Stream finished with $${formattedBalance} on Stake.com! Closest prediction was $${formattedGuess} by @${winner.username} (difference: $${formattedDiff})! Prize: ${updatedEvent.prize}! 🎉 Congratulations!`
    );

    return {
      winner,
      finalBalance,
      rankedGuesses: ranked,
      event: updatedEvent,
    };
  }

  /**
   * Reset / Archive the event for next stream
   */
  public resetEvent(): void {
    if (this.activeEvent) {
      try {
        dbOps.updateGtbEventStatus(this.db, this.activeEvent.id, 'resolved');
      } catch {}
    }
    this.activeEvent = null;
    this.guesses = [];
    this.broadcaster.emitEvent('gtb.reset', {});
  }
}
