import crypto from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { dbOps } from '../db.js';
import type { KickBotService, InboundChatMessage } from './kickBot.js';
import type {
  SlotTournament,
  SlotMatch,
  SlotTournamentStatus,
  SlotTournamentStatePayload,
} from '../../shared/types.js';

export interface TournamentBroadcaster {
  emitEvent: (event: string, data: any) => void;
}

export class SlotTournamentService {
  private activeTournament: SlotTournament | null = null;

  constructor(
    private db: DatabaseSync,
    private kickBot: KickBotService,
    private broadcaster: TournamentBroadcaster
  ) {
    this.initFromDatabase();
  }

  private initFromDatabase(): void {
    this.activeTournament = dbOps.getActiveSlotTournament(this.db) || dbOps.getLatestSlotTournament(this.db);
  }

  public getActiveTournament(): SlotTournament | null {
    if (!this.activeTournament || this.activeTournament.status === 'completed' || this.activeTournament.status === 'cancelled') {
      const active = dbOps.getActiveSlotTournament(this.db);
      if (active) {
        this.activeTournament = active;
      }
    }
    return this.activeTournament;
  }

  public getStateSnapshot(): SlotTournamentStatePayload {
    const active = this.getActiveTournament();
    const recent = dbOps.getRecentSlotTournaments(this.db, 5);
    return {
      activeTournament: active,
      recentTournaments: recent,
    };
  }

  /**
   * Handle incoming Kick chat message for !Pslot [slot name] command
   */
  public handleChatMessage(msg: InboundChatMessage): boolean {
    const content = (msg.content || '').trim();
    if (!content) return false;

    const match = content.match(/^!pslot(?:\s+(.+))?$/i);
    if (!match) return false;

    // Check authorization: only broadcaster or moderators/admins can start tournaments
    if (!this.isUserAuthorized(msg)) {
      console.warn(`[SlotTournament] Unauthorized user @${msg.username} attempted !Pslot command.`);
      return false;
    }

    const slotName = (match[1] || 'Slot Battle').trim();

    // Check if an active tournament is already running
    const currentActive = this.getActiveTournament();
    if (currentActive && (currentActive.status === 'setup' || currentActive.status === 'ready' || currentActive.status === 'in_progress')) {
      this.kickBot.queueChatReply(
        `⚠️ A Slot Battle is already in progress (${currentActive.slotName})!`
      );
      return true;
    }

    // Create new tournament
    this.createTournament(slotName, 8);
    return true;
  }

  /**
   * Check if a chat sender is authorized as broadcaster, moderator, or owner
   */
  public isUserAuthorized(msg: InboundChatMessage): boolean {
    const botState = this.kickBot.getState();
    const channelSlug = (botState.channelSlug || '').toLowerCase();
    const broadcasterId = String(botState.broadcasterId || '');
    const senderUsername = (msg.username || '').toLowerCase();
    const senderUserId = String(msg.userId || '');

    if (channelSlug && senderUsername === channelSlug) return true;
    if (broadcasterId && senderUserId === broadcasterId) return true;
    if (msg.isBroadcaster) return true;
    if (msg.isModerator) return true;

    if (Array.isArray(msg.badges)) {
      const isModOrOwner = msg.badges.some((b) => {
        const lower = String(b).toLowerCase();
        return lower.includes('broadcaster') || lower.includes('moderator') || lower.includes('mod') || lower.includes('owner');
      });
      if (isModOrOwner) return true;
    }

    return false;
  }

  /**
   * Create a new tournament
   */
  public createTournament(slotName: string, size: 8 | 16 = 8): SlotTournament {
    const cleanSlotName = (slotName || 'Slot Battle').trim();
    const id = `tourn-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const now = new Date().toISOString();

    const matches = this.generateMatches(id, size);

    const tournament: SlotTournament = {
      id,
      slotName: cleanSlotName,
      size,
      status: 'setup',
      champion: null,
      participants: Array(size).fill(''),
      matches,
      currentMatchId: matches[0]?.id || null,
      announcedMatches: [],
      startAnnounced: true,
      finalAnnounced: false,
      championAnnounced: false,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };

    dbOps.createSlotTournament(this.db, tournament);
    this.activeTournament = tournament;

    // Announce start in Kick chat: exact requested format
    this.kickBot.queueChatReply('🏆 Slot Battle has started!');

    this.broadcaster.emitEvent('tournament.created', tournament);
    this.broadcaster.emitEvent('tournament.updated', tournament);

    return tournament;
  }

  /**
   * Update tournament size (8 or 16 players) while in setup
   */
  public updateSize(size: 8 | 16): SlotTournament {
    const tournament = this.requireActiveTournament();
    if (tournament.status !== 'setup') {
      throw new Error('Tournament bracket size can only be changed during setup.');
    }

    if (tournament.size === size) return tournament;

    tournament.size = size;
    const currentParts = tournament.participants || [];
    if (size === 16) {
      tournament.participants = [...currentParts, ...Array(16 - currentParts.length).fill('')].slice(0, 16);
    } else {
      tournament.participants = currentParts.slice(0, 8);
      while (tournament.participants.length < 8) {
        tournament.participants.push('');
      }
    }

    tournament.matches = this.generateMatches(tournament.id, size, tournament.participants);
    tournament.currentMatchId = tournament.matches[0]?.id || null;
    tournament.updatedAt = new Date().toISOString();

    dbOps.updateSlotTournament(this.db, tournament);
    dbOps.saveSlotMatches(this.db, tournament.id, tournament.matches);

    this.broadcaster.emitEvent('tournament.updated', tournament);
    return tournament;
  }

  /**
   * Update participant list while in setup
   */
  public updateParticipants(participants: string[]): SlotTournament {
    const tournament = this.requireActiveTournament();
    if (tournament.status !== 'setup') {
      throw new Error('Participants can only be modified before the bracket is locked.');
    }

    const cleanList = participants.map((p) => (p || '').trim());
    while (cleanList.length < tournament.size) {
      cleanList.push('');
    }
    tournament.participants = cleanList.slice(0, tournament.size);

    // Update Round 0 match pairings with participant names
    const round0Matches = tournament.matches.filter((m) => m.roundIndex === 0);
    round0Matches.forEach((match, idx) => {
      match.player1Name = tournament.participants[idx * 2] || null;
      match.player2Name = tournament.participants[idx * 2 + 1] || null;
      match.updatedAt = new Date().toISOString();
      dbOps.updateSlotMatch(this.db, match);
    });

    tournament.updatedAt = new Date().toISOString();
    dbOps.updateSlotTournament(this.db, tournament);

    this.broadcaster.emitEvent('tournament.updated', tournament);
    return tournament;
  }

  /**
   * Shuffle participant positions randomly
   */
  public shuffleParticipants(): SlotTournament {
    const tournament = this.requireActiveTournament();
    if (tournament.status !== 'setup') {
      throw new Error('Participants can only be shuffled before the bracket is locked.');
    }

    const nonBlank = tournament.participants.filter((p) => p && p.trim().length > 0);
    for (let i = nonBlank.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nonBlank[i], nonBlank[j]] = [nonBlank[j], nonBlank[i]];
    }

    const shuffled = [...nonBlank];
    while (shuffled.length < tournament.size) {
      shuffled.push('');
    }
    return this.updateParticipants(shuffled);
  }

  /**
   * Confirm and lock bracket before starting matches
   */
  public lockBracket(): SlotTournament {
    const tournament = this.requireActiveTournament();
    if (tournament.status !== 'setup') {
      throw new Error('Bracket is already locked.');
    }

    // Validate participant count
    const filledParticipants = tournament.participants.filter((p) => p && p.trim().length > 0);
    if (filledParticipants.length !== tournament.size) {
      throw new Error(
        `All ${tournament.size} participant names must be entered before locking the bracket (currently ${filledParticipants.length}/${tournament.size}).`
      );
    }

    // Validate duplicate entries
    const seen = new Set<string>();
    for (const p of filledParticipants) {
      const normalized = p.toLowerCase();
      if (seen.has(normalized)) {
        throw new Error(`Duplicate participant detected: "${p}". Each participant should have a unique name.`);
      }
      seen.add(normalized);
    }

    // Populate Round 0 matches and set status to ready
    const round0Matches = tournament.matches.filter((m) => m.roundIndex === 0);
    round0Matches.forEach((match, idx) => {
      match.player1Name = tournament.participants[idx * 2];
      match.player2Name = tournament.participants[idx * 2 + 1];
      match.status = 'ready';
      match.updatedAt = new Date().toISOString();
      dbOps.updateSlotMatch(this.db, match);
    });

    tournament.status = 'in_progress';
    tournament.currentMatchId = round0Matches[0].id;
    tournament.updatedAt = new Date().toISOString();

    // Announce first matchup
    const firstMatch = round0Matches[0];
    if (firstMatch && firstMatch.player1Name && firstMatch.player2Name) {
      const matchAnnouncement = `⚔️ ${firstMatch.player1Name} vs ${firstMatch.player2Name}`;
      this.kickBot.queueChatReply(matchAnnouncement);
      tournament.announcedMatches = [firstMatch.id];
    }

    dbOps.updateSlotTournament(this.db, tournament);
    this.broadcaster.emitEvent('tournament.updated', tournament);

    return tournament;
  }

  /**
   * Select the winner of a match, advance them to next round, and announce next matchup
   */
  public selectWinner(
    matchId: string,
    winnerName: string,
    force: boolean = false
  ): { tournament: SlotTournament; requiresConfirmation?: boolean; affectedMatches?: string[] } {
    const tournament = this.requireActiveTournament();
    if (tournament.status !== 'in_progress') {
      throw new Error('Tournament must be in progress to select match winners.');
    }

    const match = tournament.matches.find((m) => m.id === matchId);
    if (!match) {
      throw new Error(`Match ${matchId} not found.`);
    }

    if (!match.player1Name || !match.player2Name) {
      throw new Error('Match cannot be completed when participants are unresolved.');
    }

    const cleanWinner = winnerName.trim();
    if (cleanWinner !== match.player1Name && cleanWinner !== match.player2Name) {
      throw new Error(`Winner "${cleanWinner}" is not one of the match participants (${match.player1Name} vs ${match.player2Name}).`);
    }

    // Check if this match already had a DIFFERENT winner selected previously
    if (match.winnerName && match.winnerName !== cleanWinner) {
      const downstream = this.findDownstreamMatches(tournament, match);
      const completedDownstream = downstream.filter((m) => m.status === 'completed');

      if (completedDownstream.length > 0 && !force) {
        return {
          tournament,
          requiresConfirmation: true,
          affectedMatches: completedDownstream.map((m) => `${m.roundName} (Match ${m.matchIndex + 1}): ${m.player1Name} vs ${m.player2Name}`),
        };
      }

      // If force is confirmed, invalidate all downstream matches
      this.invalidateDownstream(tournament, match);
    }

    // Set winner and mark match completed
    match.winnerName = cleanWinner;
    match.status = 'completed';
    match.updatedAt = new Date().toISOString();
    dbOps.updateSlotMatch(this.db, match);

    // Advance winner to next round match
    let finalJustBecameReady = false;
    let nextReadyMatch: SlotMatch | null = null;

    if (match.nextMatchId) {
      const nextMatch = tournament.matches.find((m) => m.id === match.nextMatchId);
      if (nextMatch) {
        if (match.nextMatchSlot === 1) {
          nextMatch.player1Name = cleanWinner;
        } else if (match.nextMatchSlot === 2) {
          nextMatch.player2Name = cleanWinner;
        }

        if (nextMatch.player1Name && nextMatch.player2Name) {
          nextMatch.status = 'ready';
          // Check if this next match is the Final
          if (nextMatch.roundName.toLowerCase().includes('final') && !nextMatch.roundName.toLowerCase().includes('semi')) {
            finalJustBecameReady = true;
          }
        }
        nextMatch.updatedAt = new Date().toISOString();
        dbOps.updateSlotMatch(this.db, nextMatch);
      }
    } else {
      // This is the FINAL MATCH!
      tournament.champion = cleanWinner;
      tournament.status = 'completed';
      tournament.completedAt = new Date().toISOString();

      // Champion announcement: exact format
      if (!tournament.championAnnounced) {
        this.kickBot.queueChatReply(`👑 ${cleanWinner} wins the Slot Battle!`);
        tournament.championAnnounced = true;
      }
    }

    // Check if the Final match is ready to be announced
    const finalMatch = tournament.matches.find(
      (m) => m.roundName.toLowerCase().includes('final') && !m.roundName.toLowerCase().includes('semi')
    );

    if (
      finalMatch &&
      finalMatch.player1Name &&
      finalMatch.player2Name &&
      !tournament.finalAnnounced &&
      tournament.status !== 'completed'
    ) {
      this.kickBot.queueChatReply(`🏆 FINAL: ${finalMatch.player1Name} vs ${finalMatch.player2Name}`);
      tournament.finalAnnounced = true;
      if (!tournament.announcedMatches.includes(finalMatch.id)) {
        tournament.announcedMatches.push(finalMatch.id);
      }
    } else if (tournament.status === 'in_progress') {
      // Announce next ready matchup if ready and not yet announced
      nextReadyMatch = this.findNextMatchToPlay(tournament);
      if (nextReadyMatch && nextReadyMatch.player1Name && nextReadyMatch.player2Name) {
        const isFinal = nextReadyMatch.roundName.toLowerCase().includes('final') && !nextReadyMatch.roundName.toLowerCase().includes('semi');
        if (!isFinal && !tournament.announcedMatches.includes(nextReadyMatch.id)) {
          this.kickBot.queueChatReply(`⚔️ ${nextReadyMatch.player1Name} vs ${nextReadyMatch.player2Name}`);
          tournament.announcedMatches.push(nextReadyMatch.id);
        }
      }
    }

    // Update current active match pointer
    const current = this.findNextMatchToPlay(tournament);
    tournament.currentMatchId = current ? current.id : finalMatch?.id || null;
    tournament.updatedAt = new Date().toISOString();

    dbOps.updateSlotTournament(this.db, tournament);
    this.broadcaster.emitEvent('tournament.updated', tournament);

    return { tournament };
  }

  /**
   * Re-announce the current matchup to Kick chat
   */
  public announceCurrentMatch(): SlotMatch | null {
    const tournament = this.requireActiveTournament();
    if (tournament.status !== 'in_progress') return null;

    const current = this.findNextMatchToPlay(tournament);
    if (!current || !current.player1Name || !current.player2Name) return null;

    const isFinal = current.roundName.toLowerCase().includes('final') && !current.roundName.toLowerCase().includes('semi');
    if (isFinal) {
      this.kickBot.queueChatReply(`🏆 FINAL: ${current.player1Name} vs ${current.player2Name}`);
    } else {
      this.kickBot.queueChatReply(`⚔️ ${current.player1Name} vs ${current.player2Name}`);
    }
    return current;
  }

  /**
   * Reset / cancel active tournament
   */
  public resetTournament(): void {
    if (this.activeTournament) {
      this.activeTournament.status = 'cancelled';
      this.activeTournament.updatedAt = new Date().toISOString();
      dbOps.updateSlotTournament(this.db, this.activeTournament);
    }
    this.activeTournament = null;
    this.broadcaster.emitEvent('tournament.reset', {});
    this.broadcaster.emitEvent('tournament.updated', null);
  }

  /**
   * Find next uncompleted match that has both players ready
   */
  private findNextMatchToPlay(tournament: SlotTournament): SlotMatch | null {
    const uncompleted = tournament.matches.filter((m) => m.status !== 'completed' && m.player1Name && m.player2Name);
    if (uncompleted.length === 0) return null;

    // Order by roundIndex asc, matchIndex asc
    uncompleted.sort((a, b) => {
      if (a.roundIndex !== b.roundIndex) return a.roundIndex - b.roundIndex;
      return a.matchIndex - b.matchIndex;
    });

    return uncompleted[0];
  }

  /**
   * Collect all downstream matches fed by this match
   */
  private findDownstreamMatches(tournament: SlotTournament, match: SlotMatch): SlotMatch[] {
    const result: SlotMatch[] = [];
    let currentId = match.nextMatchId;

    while (currentId) {
      const next = tournament.matches.find((m) => m.id === currentId);
      if (!next) break;
      result.push(next);
      currentId = next.nextMatchId;
    }
    return result;
  }

  /**
   * Invalidate downstream matches when a previous match's winner changes
   */
  private invalidateDownstream(tournament: SlotTournament, match: SlotMatch): void {
    const downstream = this.findDownstreamMatches(tournament, match);
    for (const d of downstream) {
      d.winnerName = null;
      d.status = d.player1Name && d.player2Name ? 'ready' : 'waiting';
      d.updatedAt = new Date().toISOString();
      dbOps.updateSlotMatch(this.db, d);
    }
    tournament.champion = null;
    tournament.championAnnounced = false;
    tournament.status = 'in_progress';
    tournament.completedAt = null;
  }

  private requireActiveTournament(): SlotTournament {
    const active = this.getActiveTournament();
    if (!active) {
      throw new Error('No active Slot Battle tournament found.');
    }
    return active;
  }

  /**
   * Generate bracket matches for 8 or 16 players
   */
  public generateMatches(tournamentId: string, size: 8 | 16, participants: string[] = []): SlotMatch[] {
    const matches: SlotMatch[] = [];
    const now = new Date().toISOString();

    if (size === 8) {
      // 8 players -> 3 rounds:
      // Round 0: Opening Round (4 matches)
      // Round 1: Semifinals (2 matches)
      // Round 2: Final (1 match)

      // Round 0
      for (let i = 0; i < 4; i++) {
        matches.push({
          id: `m-${tournamentId}-0-${i}`,
          tournamentId,
          roundIndex: 0,
          roundName: 'Opening Round',
          matchIndex: i,
          player1Name: participants[i * 2] || null,
          player2Name: participants[i * 2 + 1] || null,
          winnerName: null,
          status: 'waiting',
          nextMatchId: `m-${tournamentId}-1-${Math.floor(i / 2)}`,
          nextMatchSlot: ((i % 2) + 1) as 1 | 2,
          createdAt: now,
          updatedAt: now,
        });
      }

      // Round 1 (Semifinals)
      for (let i = 0; i < 2; i++) {
        matches.push({
          id: `m-${tournamentId}-1-${i}`,
          tournamentId,
          roundIndex: 1,
          roundName: 'Semifinals',
          matchIndex: i,
          player1Name: null,
          player2Name: null,
          winnerName: null,
          status: 'waiting',
          nextMatchId: `m-${tournamentId}-2-0`,
          nextMatchSlot: ((i % 2) + 1) as 1 | 2,
          createdAt: now,
          updatedAt: now,
        });
      }

      // Round 2 (Final)
      matches.push({
        id: `m-${tournamentId}-2-0`,
        tournamentId,
        roundIndex: 2,
        roundName: 'Final',
        matchIndex: 0,
        player1Name: null,
        player2Name: null,
        winnerName: null,
        status: 'waiting',
        nextMatchId: null,
        nextMatchSlot: null,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      // 16 players -> 4 rounds:
      // Round 0: Round of 16 (8 matches)
      // Round 1: Quarterfinals (4 matches)
      // Round 2: Semifinals (2 matches)
      // Round 3: Final (1 match)

      // Round 0
      for (let i = 0; i < 8; i++) {
        matches.push({
          id: `m-${tournamentId}-0-${i}`,
          tournamentId,
          roundIndex: 0,
          roundName: 'Round of 16',
          matchIndex: i,
          player1Name: participants[i * 2] || null,
          player2Name: participants[i * 2 + 1] || null,
          winnerName: null,
          status: 'waiting',
          nextMatchId: `m-${tournamentId}-1-${Math.floor(i / 2)}`,
          nextMatchSlot: ((i % 2) + 1) as 1 | 2,
          createdAt: now,
          updatedAt: now,
        });
      }

      // Round 1 (Quarterfinals)
      for (let i = 0; i < 4; i++) {
        matches.push({
          id: `m-${tournamentId}-1-${i}`,
          tournamentId,
          roundIndex: 1,
          roundName: 'Quarterfinals',
          matchIndex: i,
          player1Name: null,
          player2Name: null,
          winnerName: null,
          status: 'waiting',
          nextMatchId: `m-${tournamentId}-2-${Math.floor(i / 2)}`,
          nextMatchSlot: ((i % 2) + 1) as 1 | 2,
          createdAt: now,
          updatedAt: now,
        });
      }

      // Round 2 (Semifinals)
      for (let i = 0; i < 2; i++) {
        matches.push({
          id: `m-${tournamentId}-2-${i}`,
          tournamentId,
          roundIndex: 2,
          roundName: 'Semifinals',
          matchIndex: i,
          player1Name: null,
          player2Name: null,
          winnerName: null,
          status: 'waiting',
          nextMatchId: `m-${tournamentId}-3-0`,
          nextMatchSlot: ((i % 2) + 1) as 1 | 2,
          createdAt: now,
          updatedAt: now,
        });
      }

      // Round 3 (Final)
      matches.push({
        id: `m-${tournamentId}-3-0`,
        tournamentId,
        roundIndex: 3,
        roundName: 'Final',
        matchIndex: 0,
        player1Name: null,
        player2Name: null,
        winnerName: null,
        status: 'waiting',
        nextMatchId: null,
        nextMatchSlot: null,
        createdAt: now,
        updatedAt: now,
      });
    }

    return matches;
  }
}
