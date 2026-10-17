import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { initDatabase } from '../../src/server/db.js';
import { GiveawayService } from '../../src/server/services/giveawayService.js';
import { KickBotService } from '../../src/server/services/kickBot.js';

describe('GiveawayService Lifecycle & Participant Integrity', () => {
  let db: DatabaseSync;
  let kickBot: KickBotService;
  let emittedEvents: Array<{ event: string; data: any }>;
  let giveawayService: GiveawayService;

  beforeEach(() => {
    // In-memory isolated database for each test
    db = new DatabaseSync(':memory:');
    initDatabase(db);

    emittedEvents = [];
    kickBot = new KickBotService({ channelSlug: 'test_channel' });

    giveawayService = new GiveawayService(db, kickBot, {
      emitEvent: (event, data) => {
        emittedEvents.push({ event, data });
      },
    });
  });

  afterEach(() => {
    db.close();
  });

  it('creates a giveaway in draft state and persists it', () => {
    const gw = giveawayService.createGiveaway('VIP Sub Giveaway', 'Secret Prize', '!enter');

    expect(gw.status).toBe('draft');
    expect(gw.title).toBe('VIP Sub Giveaway');
    expect(gw.prize).toBe('Secret Prize');
    expect(gw.keyword).toBe('!enter');
    expect(gw.participantCount).toBe(0);

    expect(emittedEvents.some((e) => e.event === 'giveaway.created')).toBe(true);
  });

  it('prevents creating a second active giveaway if one is already open', () => {
    const gw = giveawayService.createGiveaway('First Giveaway', 'Prize 1', '!join');
    giveawayService.openGiveaway(gw.id);

    expect(() => giveawayService.createGiveaway('Second Giveaway', 'Prize 2', '!join')).toThrow(
      'An active giveaway is currently running. Please close or complete it first.'
    );
  });

  it('accepts entries with matching keyword only while open', () => {
    const gw = giveawayService.createGiveaway('Open Test', '$100 Gift Card', '!join');
    giveawayService.openGiveaway(gw.id);

    // Matching keyword
    const entered = giveawayService.handleChatMessage({
      id: 'm1',
      userId: 'user_123',
      username: 'CoolGamer',
      content: '!join',
      timestamp: new Date().toISOString(),
    });

    expect(entered).toBe(true);
    expect(giveawayService.getActiveGiveaway()?.participantCount).toBe(1);

    // Non-matching chat message
    const nonMatch = giveawayService.handleChatMessage({
      id: 'm2',
      userId: 'user_456',
      username: 'Chatterbox',
      content: 'hello chat and streamer!',
      timestamp: new Date().toISOString(),
    });

    expect(nonMatch).toBe(false);
    expect(giveawayService.getActiveGiveaway()?.participantCount).toBe(1);
  });

  it('prevents the same viewer from entering twice (duplicate protection)', () => {
    const gw = giveawayService.createGiveaway('Duplicate Test', 'Headphones', '!join');
    giveawayService.openGiveaway(gw.id);

    const first = giveawayService.handleChatMessage({
      id: 'm1',
      userId: 'user_same',
      username: 'SameUser',
      content: '!join',
      timestamp: new Date().toISOString(),
    });
    expect(first).toBe(true);

    // Second entry by same user
    const second = giveawayService.handleChatMessage({
      id: 'm2',
      userId: 'user_same',
      username: 'SameUser',
      content: '!join',
      timestamp: new Date().toISOString(),
    });
    expect(second).toBe(false);

    expect(giveawayService.getActiveGiveaway()?.participantCount).toBe(1);
  });

  it('rejects entries when giveaway is closed', () => {
    const gw = giveawayService.createGiveaway('Close Test', 'Keyboard', '!join');
    giveawayService.openGiveaway(gw.id);
    giveawayService.closeGiveaway(gw.id);

    const entered = giveawayService.handleChatMessage({
      id: 'm1',
      userId: 'user_late',
      username: 'LateGuy',
      content: '!join',
      timestamp: new Date().toISOString(),
    });

    expect(entered).toBe(false);
    expect(giveawayService.getActiveGiveaway()?.participantCount).toBe(0);
  });

  it('prevents starting a draw with zero participants', () => {
    const gw = giveawayService.createGiveaway('Empty Test', 'Mouse', '!join');
    giveawayService.openGiveaway(gw.id);

    expect(() => giveawayService.startWinnerDraw()).toThrow(
      'Cannot start draw: No eligible participants entered the giveaway.'
    );
  });

  it('executes a complete draw and reveal lifecycle', () => {
    const gw = giveawayService.createGiveaway('Full Flow', 'Microphone', '!join');
    giveawayService.openGiveaway(gw.id);

    giveawayService.manuallyAddParticipant('ViewerA');
    giveawayService.manuallyAddParticipant('ViewerB');
    giveawayService.manuallyAddParticipant('ViewerC');

    expect(giveawayService.getActiveGiveaway()?.participantCount).toBe(3);

    // Start draw
    const drawData = giveawayService.startWinnerDraw();
    expect(drawData).toBeDefined();
    expect(giveawayService.getActiveGiveaway()?.status).toBe('drawing');
    expect(['ViewerA', 'ViewerB', 'ViewerC']).toContain(drawData.winner.username);

    // Reveal winner
    const { winner, giveaway: completedGw } = giveawayService.revealWinner();
    expect(completedGw.status).toBe('completed');
    expect(completedGw.winnerUsername).toBe(winner.username);
  });

  it('allows removing an invalid participant with recount', () => {
    const gw = giveawayService.createGiveaway('Remove Test', 'Monitor', '!join');
    giveawayService.openGiveaway(gw.id);

    const p = giveawayService.manuallyAddParticipant('TrollUser');
    expect(giveawayService.getActiveGiveaway()?.participantCount).toBe(1);

    const removed = giveawayService.removeParticipant(gw.id, p.id);
    expect(removed).toBe(true);
    expect(giveawayService.getActiveGiveaway()?.participantCount).toBe(0);
  });

  it('persists giveaway history through database recreation (restart resilience)', () => {
    const gw = giveawayService.createGiveaway('Persistent Giveaway', 'Laptop', '!join');
    giveawayService.openGiveaway(gw.id);
    giveawayService.manuallyAddParticipant('SurvivorUser');
    giveawayService.startWinnerDraw();
    giveawayService.revealWinner();

    // Recreate a new GiveawayService instance pointing to the same SQLite database
    const restartedService = new GiveawayService(db, kickBot, {
      emitEvent: () => {},
    });

    const snapshot = restartedService.getStateSnapshot();
    expect(snapshot.recentHistory.length).toBeGreaterThan(0);
    expect(snapshot.recentHistory[0].title).toBe('Persistent Giveaway');
    expect(snapshot.recentHistory[0].status).toBe('completed');
    expect(snapshot.recentHistory[0].winnerUsername).toBe('SurvivorUser');
  });
});
