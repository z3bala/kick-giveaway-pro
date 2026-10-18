import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { initDatabase, dbOps } from '../../src/server/db.js';
import { SlotTournamentService } from '../../src/server/services/slotTournamentService.js';
import type { KickBotService, InboundChatMessage } from '../../src/server/services/kickBot.js';

describe('Slot Battle Tournament System', () => {
  let db: DatabaseSync;
  let tournamentService: SlotTournamentService;
  let emittedEvents: Array<{ event: string; data: any }> = [];
  let botReplies: string[] = [];

  const mockBroadcaster = {
    emitEvent: (event: string, data: any) => {
      emittedEvents.push({ event, data });
    },
  };

  const mockKickBot = {
    getState: () => ({
      status: 'connected',
      channelSlug: 'frixen1',
      broadcasterId: '29176855',
      lastError: null,
      lastMessageTime: null,
      mode: 'pusher_websocket',
    }),
    queueChatReply: (msg: string) => {
      botReplies.push(msg);
    },
  } as unknown as KickBotService;

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    initDatabase(db);
    emittedEvents = [];
    botReplies = [];
    tournamentService = new SlotTournamentService(db, mockKickBot, mockBroadcaster);
  });

  afterEach(() => {
    try {
      db.close();
    } catch {}
  });

  it('correctly handles !Pslot command from authorized broadcaster with slot name extraction', () => {
    const msg: InboundChatMessage = {
      id: 'm1',
      userId: '29176855',
      username: 'frixen1',
      content: '!Pslot Gates of Olympus',
      timestamp: new Date().toISOString(),
      isBroadcaster: true,
    };

    const handled = tournamentService.handleChatMessage(msg);
    expect(handled).toBe(true);

    const active = tournamentService.getActiveTournament();
    expect(active).not.toBeNull();
    expect(active?.slotName).toBe('Gates of Olympus');
    expect(active?.status).toBe('setup');
    expect(active?.size).toBe(8);

    // Exact announcement format requirement:
    expect(botReplies).toContain('🏆 Slot Battle has started!');
  });

  it('correctly extracts complex slot names with special characters and spaces', () => {
    const msg: InboundChatMessage = {
      id: 'm2',
      userId: '29176855',
      username: 'frixen1',
      content: "!Pslot Lilith's Curse",
      timestamp: new Date().toISOString(),
      isBroadcaster: true,
    };

    tournamentService.handleChatMessage(msg);
    const active = tournamentService.getActiveTournament();
    expect(active?.slotName).toBe("Lilith's Curse");
  });

  it('rejects !Pslot command from unauthorized regular viewers', () => {
    const msg: InboundChatMessage = {
      id: 'm3',
      userId: '99999999',
      username: 'regular_viewer',
      content: '!Pslot Sweet Bonanza',
      timestamp: new Date().toISOString(),
      isBroadcaster: false,
      isModerator: false,
    };

    const handled = tournamentService.handleChatMessage(msg);
    expect(handled).toBe(false);

    const active = tournamentService.getActiveTournament();
    expect(active).toBeNull();
    expect(botReplies.length).toBe(0);
  });

  it('allows authorized moderators with moderator badge to start tournament', () => {
    const msg: InboundChatMessage = {
      id: 'm4',
      userId: '11223344',
      username: 'head_mod',
      content: '!Pslot Sweet Bonanza',
      timestamp: new Date().toISOString(),
      badges: ['moderator'],
      isModerator: true,
    };

    const handled = tournamentService.handleChatMessage(msg);
    expect(handled).toBe(true);

    const active = tournamentService.getActiveTournament();
    expect(active).not.toBeNull();
    expect(active?.slotName).toBe('Sweet Bonanza');
  });

  it('prevents overwriting an active tournament and warns the broadcaster', () => {
    // Start tournament 1
    tournamentService.handleChatMessage({
      id: 'm1',
      userId: '29176855',
      username: 'frixen1',
      content: '!Pslot Gates of Olympus',
      timestamp: new Date().toISOString(),
      isBroadcaster: true,
    });

    botReplies = [];

    // Attempt to start tournament 2 while tournament 1 is active
    const handledSecond = tournamentService.handleChatMessage({
      id: 'm2',
      userId: '29176855',
      username: 'frixen1',
      content: '!Pslot Sweet Bonanza',
      timestamp: new Date().toISOString(),
      isBroadcaster: true,
    });

    expect(handledSecond).toBe(true);
    const active = tournamentService.getActiveTournament();
    expect(active?.slotName).toBe('Gates of Olympus'); // Unchanged
    expect(botReplies.some((r) => r.includes('already in progress'))).toBe(true);
  });

  it('generates a correct 8-player bracket (4 opening, 2 semifinals, 1 final = 7 matches)', () => {
    const tournament = tournamentService.createTournament('Gates of Olympus', 8);
    expect(tournament.matches.length).toBe(7);

    const openingRound = tournament.matches.filter((m) => m.roundIndex === 0);
    const semifinals = tournament.matches.filter((m) => m.roundIndex === 1);
    const final = tournament.matches.filter((m) => m.roundIndex === 2);

    expect(openingRound.length).toBe(4);
    expect(semifinals.length).toBe(2);
    expect(final.length).toBe(1);

    // Verify next match linkages
    expect(openingRound[0].nextMatchId).toBe(semifinals[0].id);
    expect(openingRound[0].nextMatchSlot).toBe(1);
    expect(openingRound[1].nextMatchId).toBe(semifinals[0].id);
    expect(openingRound[1].nextMatchSlot).toBe(2);

    expect(openingRound[2].nextMatchId).toBe(semifinals[1].id);
    expect(openingRound[2].nextMatchSlot).toBe(1);
    expect(openingRound[3].nextMatchId).toBe(semifinals[1].id);
    expect(openingRound[3].nextMatchSlot).toBe(2);

    expect(semifinals[0].nextMatchId).toBe(final[0].id);
    expect(semifinals[0].nextMatchSlot).toBe(1);
    expect(semifinals[1].nextMatchId).toBe(final[0].id);
    expect(semifinals[1].nextMatchSlot).toBe(2);

    expect(final[0].nextMatchId).toBeNull();
  });

  it('generates a correct 16-player bracket (8 opening, 4 quarterfinals, 2 semifinals, 1 final = 15 matches)', () => {
    const tournament = tournamentService.createTournament('Sweet Bonanza', 16);
    expect(tournament.matches.length).toBe(15);

    const roundOf16 = tournament.matches.filter((m) => m.roundIndex === 0);
    const quarterfinals = tournament.matches.filter((m) => m.roundIndex === 1);
    const semifinals = tournament.matches.filter((m) => m.roundIndex === 2);
    const final = tournament.matches.filter((m) => m.roundIndex === 3);

    expect(roundOf16.length).toBe(8);
    expect(quarterfinals.length).toBe(4);
    expect(semifinals.length).toBe(2);
    expect(final.length).toBe(1);
  });

  it('prevents locking bracket with incomplete participants or duplicate names', () => {
    tournamentService.createTournament('Gates of Olympus', 8);

    // Missing participants
    expect(() => tournamentService.lockBracket()).toThrow(/participant names must be entered/);

    // Duplicate participants
    tournamentService.updateParticipants(['Ahmed', 'Mohamed', 'Karim', 'Sami', 'Omar', 'Youssef', 'Tariq', 'Ahmed']);
    expect(() => tournamentService.lockBracket()).toThrow(/Duplicate participant/);
  });

  it('locks bracket, advances winners into correct positions, and announces matchups and champion', () => {
    tournamentService.createTournament('Gates of Olympus', 8);

    const players = ['Ahmed', 'Mohamed', 'Karim', 'Sami', 'Omar', 'Youssef', 'Tariq', 'Zaid'];
    tournamentService.updateParticipants(players);

    botReplies = [];

    // Lock bracket -> tournament starts, announces first match
    tournamentService.lockBracket();
    const active = tournamentService.getActiveTournament()!;
    expect(active.status).toBe('in_progress');

    // First match announcement: exact format
    expect(botReplies).toContain('⚔️ Ahmed vs Mohamed');

    // Match 0: Ahmed vs Mohamed -> Streamer selects Ahmed
    botReplies = [];
    tournamentService.selectWinner(active.matches[0].id, 'Ahmed');

    // Verify Ahmed advanced to Semifinal 1 (Match 4 Slot 1)
    const semi1 = active.matches.find((m) => m.id === active.matches[0].nextMatchId)!;
    expect(semi1.player1Name).toBe('Ahmed');
    expect(semi1.player2Name).toBeNull(); // Mohamed eliminated

    // Next ready match in Round 0 announced (Match 1: Karim vs Sami)
    expect(botReplies).toContain('⚔️ Karim vs Sami');

    // Complete remaining Round 0 matches:
    // Match 1: Karim wins over Sami
    tournamentService.selectWinner(active.matches[1].id, 'Karim');
    expect(semi1.player2Name).toBe('Karim');
    expect(semi1.status).toBe('ready');

    // Match 2: Omar wins over Youssef
    tournamentService.selectWinner(active.matches[2].id, 'Omar');

    // Match 3: Tariq wins over Zaid
    tournamentService.selectWinner(active.matches[3].id, 'Tariq');

    // Both Semifinals are now populated:
    // Semi 1: Ahmed vs Karim
    // Semi 2: Omar vs Tariq
    const semi2 = active.matches.find((m) => m.id === active.matches[2].nextMatchId)!;
    expect(semi2.player1Name).toBe('Omar');
    expect(semi2.player2Name).toBe('Tariq');

    // Streamer plays Semifinal 1: Ahmed wins over Karim
    botReplies = [];
    tournamentService.selectWinner(semi1.id, 'Ahmed');

    // Final is NOT ready yet, because Semifinal 2 is uncompleted
    const finalMatch = active.matches.find((m) => m.roundIndex === 2)!;
    expect(finalMatch.player1Name).toBe('Ahmed');
    expect(finalMatch.player2Name).toBeNull();
    expect(botReplies.some((r) => r.includes('FINAL'))).toBe(false);

    // Streamer plays Semifinal 2: Omar wins over Tariq
    botReplies = [];
    tournamentService.selectWinner(semi2.id, 'Omar');

    // Now BOTH finalists are determined! Final announced: exact format
    expect(finalMatch.player1Name).toBe('Ahmed');
    expect(finalMatch.player2Name).toBe('Omar');
    expect(botReplies).toContain('🏆 FINAL: Ahmed vs Omar');

    // Streamer conducts Final: Ahmed wins!
    botReplies = [];
    tournamentService.selectWinner(finalMatch.id, 'Ahmed');

    expect(active.status).toBe('completed');
    expect(active.champion).toBe('Ahmed');

    // Champion announcement: exact format
    expect(botReplies).toContain('👑 Ahmed wins the Slot Battle!');
  });

  it('safely handles winner correction with downstream invalidation', () => {
    tournamentService.createTournament('Gates of Olympus', 8);
    const players = ['Ahmed', 'Mohamed', 'Karim', 'Sami', 'Omar', 'Youssef', 'Tariq', 'Zaid'];
    tournamentService.updateParticipants(players);
    tournamentService.lockBracket();

    const active = tournamentService.getActiveTournament()!;

    // Play Match 0: Ahmed wins over Mohamed
    tournamentService.selectWinner(active.matches[0].id, 'Ahmed');
    // Play Match 1: Karim wins over Sami
    tournamentService.selectWinner(active.matches[1].id, 'Karim');

    // Semifinal 1 is now: Ahmed vs Karim
    const semi1 = active.matches.find((m) => m.roundIndex === 1 && m.matchIndex === 0)!;
    expect(semi1.player1Name).toBe('Ahmed');
    expect(semi1.player2Name).toBe('Karim');

    // Play Semifinal 1: Ahmed wins over Karim
    tournamentService.selectWinner(semi1.id, 'Ahmed');
    expect(semi1.winnerName).toBe('Ahmed');
    expect(semi1.status).toBe('completed');

    // Streamer realizes: Wait! In Match 0, Mohamed actually won!
    // Attempting to change winner without force triggers confirmation with affected matches:
    const checkCorrection = tournamentService.selectWinner(active.matches[0].id, 'Mohamed', false);
    expect(checkCorrection.requiresConfirmation).toBe(true);
    expect(checkCorrection.affectedMatches?.length).toBeGreaterThan(0);

    // Streamer confirms: force = true
    tournamentService.selectWinner(active.matches[0].id, 'Mohamed', true);

    // Verify Match 0 is updated to Mohamed
    expect(active.matches[0].winnerName).toBe('Mohamed');

    // Verify downstream Semifinal 1 winner was invalidated and Mohamed replaced Ahmed:
    expect(semi1.player1Name).toBe('Mohamed');
    expect(semi1.winnerName).toBeNull();
    expect(semi1.status).toBe('ready'); // Ready to be replayed with Mohamed vs Karim!
  });

  it('persists tournament through database restart resilience', () => {
    const tournament = tournamentService.createTournament('Gates of Olympus', 8);
    const players = ['Ahmed', 'Mohamed', 'Karim', 'Sami', 'Omar', 'Youssef', 'Tariq', 'Zaid'];
    tournamentService.updateParticipants(players);
    tournamentService.lockBracket();
    tournamentService.selectWinner(tournament.matches[0].id, 'Ahmed');

    // Simulate bot/server restart with new service instance pointing to same database
    const restoredService = new SlotTournamentService(db, mockKickBot, mockBroadcaster);
    const restoredTournament = restoredService.getActiveTournament();

    expect(restoredTournament).not.toBeNull();
    expect(restoredTournament?.id).toBe(tournament.id);
    expect(restoredTournament?.slotName).toBe('Gates of Olympus');
    expect(restoredTournament?.status).toBe('in_progress');
    expect(restoredTournament?.matches.length).toBe(7);
    expect(restoredTournament?.matches[0].winnerName).toBe('Ahmed');
    expect(restoredTournament?.matches[0].status).toBe('completed');
  });

  it('allows starting a new tournament after the previous one is completed', () => {
    tournamentService.createTournament('Gates of Olympus', 8);
    const players = ['Ahmed', 'Mohamed', 'Karim', 'Sami', 'Omar', 'Youssef', 'Tariq', 'Zaid'];
    tournamentService.updateParticipants(players);
    tournamentService.lockBracket();

    // Complete all matches quickly
    const active = tournamentService.getActiveTournament()!;
    tournamentService.selectWinner(active.matches[0].id, 'Ahmed');
    tournamentService.selectWinner(active.matches[1].id, 'Karim');
    tournamentService.selectWinner(active.matches[2].id, 'Omar');
    tournamentService.selectWinner(active.matches[3].id, 'Tariq');

    const semi1 = active.matches.find((m) => m.roundIndex === 1 && m.matchIndex === 0)!;
    const semi2 = active.matches.find((m) => m.roundIndex === 1 && m.matchIndex === 1)!;
    tournamentService.selectWinner(semi1.id, 'Ahmed');
    tournamentService.selectWinner(semi2.id, 'Omar');

    const finalMatch = active.matches.find((m) => m.roundIndex === 2)!;
    tournamentService.selectWinner(finalMatch.id, 'Ahmed');

    expect(active.status).toBe('completed');
    expect(active.champion).toBe('Ahmed');

    // Now start a brand new tournament with !Pslot
    botReplies = [];
    const newMsg: InboundChatMessage = {
      id: 'mNew',
      userId: '29176855',
      username: 'frixen1',
      content: '!Pslot Sweet Bonanza',
      timestamp: new Date().toISOString(),
      isBroadcaster: true,
    };

    const handled = tournamentService.handleChatMessage(newMsg);
    expect(handled).toBe(true);

    const newActive = tournamentService.getActiveTournament()!;
    expect(newActive.slotName).toBe('Sweet Bonanza');
    expect(newActive.status).toBe('setup');
    expect(botReplies).toContain('🏆 Slot Battle has started!');
  });
});
