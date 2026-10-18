import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/server/index.js';

describe('Slot Battle Tournament API & Chat Command Integration Flow', () => {
  let app: any;
  let server: any;
  let db: any;
  let kickBot: any;
  let slotTournamentService: any;
  const adminSecret = 'tournament-test-secret-123';

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_PATH = ':memory:';
    process.env.ADMIN_SECRET = adminSecret;
    process.env.OVERLAY_TOKEN = 'test-overlay-token';
    process.env.KICK_CHANNEL_SLUG = 'frixen1';
    process.env.KICK_BROADCASTER_ID = '29176855';

    const setup = createApp();
    app = setup.app;
    server = setup.server;
    db = setup.db;
    kickBot = setup.kickBot;
    slotTournamentService = setup.slotTournamentService;
  });

  afterAll(() => {
    server.close();
    db.close();
  });

  it('rejects unauthorized requests to protected tournament endpoints', async () => {
    const res = await request(app)
      .post('/api/tournament/create')
      .send({
        slotName: 'Gates of Olympus',
        size: 8,
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('allows authorized requests with admin secret to create a tournament', async () => {
    const res = await request(app)
      .post('/api/tournament/create')
      .set('Authorization', `Bearer ${adminSecret}`)
      .send({
        slotName: 'Gates of Olympus',
        size: 8,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.tournament.slotName).toBe('Gates of Olympus');
    expect(res.body.tournament.size).toBe(8);
    expect(res.body.tournament.status).toBe('setup');
  });

  it('returns active tournament on public GET /api/tournament/active', async () => {
    const res = await request(app).get('/api/tournament/active');
    expect(res.status).toBe(200);
    expect(res.body.activeTournament).not.toBeNull();
    expect(res.body.activeTournament.slotName).toBe('Gates of Olympus');
  });

  it('updates tournament size between 8 and 16', async () => {
    const res = await request(app)
      .post('/api/tournament/size')
      .set('Authorization', `Bearer ${adminSecret}`)
      .send({ size: 16 });

    expect(res.status).toBe(200);
    expect(res.body.tournament.size).toBe(16);
    expect(res.body.tournament.matches.length).toBe(15);

    // Switch back to 8
    const res8 = await request(app)
      .post('/api/tournament/size')
      .set('Authorization', `Bearer ${adminSecret}`)
      .send({ size: 8 });

    expect(res8.status).toBe(200);
    expect(res8.body.tournament.size).toBe(8);
    expect(res8.body.tournament.matches.length).toBe(7);
  });

  it('updates participant list and prevents locking with incomplete participants', async () => {
    // Incomplete list
    const resIncomplete = await request(app)
      .post('/api/tournament/lock')
      .set('Authorization', `Bearer ${adminSecret}`);

    expect(resIncomplete.status).toBe(400);

    // Provide 8 valid participants
    const participants = ['Ahmed', 'Mohamed', 'Karim', 'Sami', 'Omar', 'Youssef', 'Tariq', 'Zaid'];
    const resUpdate = await request(app)
      .post('/api/tournament/participants')
      .set('Authorization', `Bearer ${adminSecret}`)
      .send({ participants });

    expect(resUpdate.status).toBe(200);
    expect(resUpdate.body.tournament.participants).toEqual(participants);
  });

  it('locks bracket and starts tournament, setting status to in_progress', async () => {
    const res = await request(app)
      .post('/api/tournament/lock')
      .set('Authorization', `Bearer ${adminSecret}`);

    expect(res.status).toBe(200);
    expect(res.body.tournament.status).toBe('in_progress');
    expect(res.body.tournament.matches[0].status).toBe('ready');
    expect(res.body.tournament.matches[0].player1Name).toBe('Ahmed');
    expect(res.body.tournament.matches[0].player2Name).toBe('Mohamed');
  });

  it('selects match winners and advances players to the next round', async () => {
    const activeRes = await request(app).get('/api/tournament/active');
    const match0 = activeRes.body.activeTournament.matches[0];

    const winRes = await request(app)
      .post('/api/tournament/winner')
      .set('Authorization', `Bearer ${adminSecret}`)
      .send({
        matchId: match0.id,
        winnerName: 'Ahmed',
      });

    expect(winRes.status).toBe(200);
    const updatedMatches = winRes.body.tournament.matches;
    const match0Updated = updatedMatches.find((m: any) => m.id === match0.id);
    expect(match0Updated.status).toBe('completed');
    expect(match0Updated.winnerName).toBe('Ahmed');

    // Ahmed advanced to Semifinal 1
    const semi1 = updatedMatches.find((m: any) => m.id === match0.nextMatchId);
    expect(semi1.player1Name).toBe('Ahmed');
  });

  it('creates tournament via simulated chat command !Pslot when sent by broadcaster', async () => {
    // First reset existing tournament
    await request(app)
      .post('/api/tournament/reset')
      .set('Authorization', `Bearer ${adminSecret}`);

    // Simulate chat command !Pslot Sweet Bonanza from channel owner frixen1
    const chatRes = await request(app)
      .post('/api/kick/simulate-chat')
      .set('Authorization', `Bearer ${adminSecret}`)
      .send({
        username: 'frixen1',
        message: '!Pslot Sweet Bonanza',
      });

    expect(chatRes.status).toBe(200);

    // Verify tournament was created
    const activeRes = await request(app).get('/api/tournament/active');
    expect(activeRes.body.activeTournament).not.toBeNull();
    expect(activeRes.body.activeTournament.slotName).toBe('Sweet Bonanza');
    expect(activeRes.body.activeTournament.status).toBe('setup');
  });
});
