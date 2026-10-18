import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { initDatabase } from '../../src/server/db.js';
import { GtbService } from '../../src/server/services/gtbService.js';
import type { Broadcaster } from '../../src/server/sockets/broadcaster.js';
import type { KickBotService } from '../../src/server/services/kickBot.js';

describe('Guess The Balance (GTB) Closest Prediction Resolution', () => {
  let db: DatabaseSync;
  let gtbService: GtbService;
  let emittedEvents: Array<{ event: string; data: any }> = [];
  let botReplies: string[] = [];

  const mockBroadcaster = {
    emitEvent: (event: string, data: any) => {
      emittedEvents.push({ event, data });
    },
  } as unknown as Broadcaster;

  const mockKickBot = {
    queueChatReply: (msg: string) => {
      botReplies.push(msg);
    },
  } as unknown as KickBotService;

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    initDatabase(db);
    emittedEvents = [];
    botReplies = [];
    gtbService = new GtbService(db, mockKickBot, mockBroadcaster);
  });

  afterEach(() => {
    try {
      db.close();
    } catch {}
  });

  it('creates an active GTB event and queues chat announcement', () => {
    const event = gtbService.createEvent('Stake Ending Balance', '$100 Tip', '!gtb');
    expect(event.title).toBe('Stake Ending Balance');
    expect(event.prize).toBe('$100 Tip');
    expect(event.keyword).toBe('!gtb');
    expect(event.status).toBe('open');
    expect(botReplies.some((r) => r.includes('GUESS THE BALANCE IS OPEN'))).toBe(true);
  });

  it('records guesses from chat with various currency formats', () => {
    gtbService.createEvent('Stake Ending Balance', '$50', '!gtb');

    // Chat formats: !gtb 260, !gtb $180.50, !gtb 310$
    const r1 = gtbService.handleChatMessage({
      messageId: 'm1',
      senderId: 'u1',
      username: 'ViewerAlice',
      content: '!gtb 260',
      timestamp: new Date().toISOString(),
    });
    const r2 = gtbService.handleChatMessage({
      messageId: 'm2',
      senderId: 'u2',
      username: 'ViewerBob',
      content: '!gtb $180.50',
      timestamp: new Date().toISOString(),
    });
    const r3 = gtbService.handleChatMessage({
      messageId: 'm3',
      senderId: 'u3',
      username: 'ViewerCharlie',
      content: '!gtb 310$',
      timestamp: new Date().toISOString(),
    });

    expect(r1).toBe(true);
    expect(r2).toBe(true);
    expect(r3).toBe(true);

    const guesses = gtbService.getGuesses();
    expect(guesses.length).toBe(3);
    expect(guesses.find((g) => g.username === 'ViewerAlice')?.guess).toBe(260);
    expect(guesses.find((g) => g.username === 'ViewerBob')?.guess).toBe(180.5);
    expect(guesses.find((g) => g.username === 'ViewerCharlie')?.guess).toBe(310);
  });

  it('allows a viewer to guess only once and prevents changing predictions', () => {
    gtbService.createEvent('Stake Ending Balance', '$50', '!gtb');

    const firstResult = gtbService.handleChatMessage({
      messageId: 'm1',
      senderId: 'u1',
      username: 'ViewerAlice',
      content: '!gtb 200',
      timestamp: '2026-10-18T00:00:00Z',
    });

    // Alice tries to change her prediction to 255
    const secondResult = gtbService.handleChatMessage({
      messageId: 'm2',
      senderId: 'u1',
      username: 'ViewerAlice',
      content: '!gtb 255',
      timestamp: '2026-10-18T00:01:00Z',
    });

    expect(firstResult).toBe(true);
    expect(secondResult).toBe(false);

    const guesses = gtbService.getGuesses();
    expect(guesses.length).toBe(1);
    expect(guesses[0].guess).toBe(200); // Original prediction of 200 is preserved!

    // Verify warning reply queued for chat
    expect(
      botReplies.some(
        (r) => r.includes('already predicted $200.00') && r.includes('cannot be changed')
      )
    ).toBe(true);
  });

  it('accurately resolves closest prediction to the typed balance', () => {
    gtbService.createEvent('Stake Ending Balance', '$50 Stake Tip', '!gtb');

    // Viewer guesses: 150, 248.50, 260, 310, 500
    gtbService.recordGuess('User1', 150);
    gtbService.recordGuess('User2', 248.5);
    gtbService.recordGuess('User3', 260);
    gtbService.recordGuess('User4', 310);
    gtbService.recordGuess('User5', 500);

    // Streamer finishes Stake.com session with $254.20
    const finalBalance = 254.2;
    const { winner, event } = gtbService.resolveClosestPrediction(finalBalance);

    // Math.abs(248.50 - 254.20) = 5.70
    // Math.abs(260.00 - 254.20) = 5.80
    // User2 is closer!
    expect(winner.username).toBe('User2');
    expect(winner.guess).toBe(248.5);
    expect(winner.diff).toBeCloseTo(5.7, 2);

    expect(event.status).toBe('resolved');
    expect(event.winnerUsername).toBe('User2');
    expect(event.finalBalance).toBe(254.2);

    // Verify winner announcement broadcast to Kick chat
    expect(botReplies.some((r) => r.includes('GUESS THE BALANCE RESULT') && r.includes('@User2'))).toBe(true);

    // Verify socket event broadcast
    expect(emittedEvents.some((e) => e.event === 'gtb.resolved')).toBe(true);
  });

  it('resolves exact match when a viewer guesses the exact balance', () => {
    gtbService.createEvent('Stake Ending Balance', '$100', '!gtb');

    gtbService.recordGuess('GamerA', 200);
    gtbService.recordGuess('SniperB', 260);
    gtbService.recordGuess('GamerC', 300);

    const { winner } = gtbService.resolveClosestPrediction(260);
    expect(winner.username).toBe('SniperB');
    expect(winner.diff).toBe(0);
  });

  it('breaks ties fairly by earliest timestamp if two guesses are equally close', () => {
    gtbService.createEvent('Stake Ending Balance', '$50', '!gtb');

    // Final balance will be 260
    // EarlyUser guesses 250 (10 away) at time 1
    // LateUser guesses 270 (10 away) at time 2
    gtbService.recordGuess('EarlyUser', 250, 'user_early', '2026-10-18T00:00:00Z');
    gtbService.recordGuess('LateUser', 270, 'user_late', '2026-10-18T00:05:00Z');

    const { winner } = gtbService.resolveClosestPrediction(260);
    expect(winner.username).toBe('EarlyUser');
    expect(winner.diff).toBe(10);
  });
});
