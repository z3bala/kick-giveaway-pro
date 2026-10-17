import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/server/index.js';

describe('Full REST API & Integration Flow', () => {
  let app: any;
  let server: any;
  let db: any;
  const adminSecret = 'test-secret-passphrase-123';

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_PATH = ':memory:';
    process.env.ADMIN_SECRET = adminSecret;
    process.env.OVERLAY_TOKEN = 'test-overlay-token';

    const setup = createApp();
    app = setup.app;
    server = setup.server;
    db = setup.db;
  });

  afterAll(() => {
    server.close();
    db.close();
  });

  it('rejects unauthorized requests to protected endpoints when ADMIN_SECRET is set', async () => {
    const res = await request(app)
      .post('/api/giveaway/create')
      .send({
        title: 'Unauthorized Test',
        prize: 'Secret',
        keyword: '!join',
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('allows authorized requests with Bearer token', async () => {
    const res = await request(app)
      .post('/api/giveaway/create')
      .set('Authorization', `Bearer ${adminSecret}`)
      .send({
        title: 'Integration Test Giveaway',
        prize: 'Gamer Chair',
        keyword: '!join',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.giveaway.title).toBe('Integration Test Giveaway');
    expect(res.body.giveaway.status).toBe('draft');
  });

  it('opens entries for the created giveaway', async () => {
    const res = await request(app)
      .post('/api/giveaway/open')
      .set('Authorization', `Bearer ${adminSecret}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.giveaway.status).toBe('open');
  });

  it('registers participant via simulated chat message', async () => {
    const chatRes = await request(app)
      .post('/api/kick/simulate-chat')
      .set('Authorization', `Bearer ${adminSecret}`)
      .send({
        username: 'ViewerOne',
        message: '!join',
      });

    expect(chatRes.status).toBe(200);
    expect(chatRes.body.success).toBe(true);

    // Verify participant is in active giveaway state
    const stateRes = await request(app).get('/api/giveaway/active');
    expect(stateRes.status).toBe(200);
    expect(stateRes.body.giveaway.participantCount).toBe(1);
    expect(stateRes.body.participants.length).toBe(1);
    expect(stateRes.body.participants[0].username).toBe('ViewerOne');
  });

  it('handles incoming official Kick webhook payloads', async () => {
    const webhookRes = await request(app)
      .post('/api/kick/webhook')
      .set('Kick-Event-Type', 'chat.message.sent')
      .send({
        message_id: 'webhook-msg-99',
        sender: {
          user_id: 8888,
          username: 'WebhookViewer',
        },
        content: '!join',
      });

    expect(webhookRes.status).toBe(200);
    expect(webhookRes.body.received).toBe(true);

    const stateRes = await request(app).get('/api/giveaway/active');
    expect(stateRes.body.giveaway.participantCount).toBe(2);
  });

  it('starts CS roll draw and selects a valid winner from entrants', async () => {
    const drawRes = await request(app)
      .post('/api/giveaway/draw')
      .set('Authorization', `Bearer ${adminSecret}`)
      .send({});

    expect(drawRes.status).toBe(200);
    expect(drawRes.body.success).toBe(true);
    expect(drawRes.body.drawData.targetIndex).toBe(48);
    expect(['ViewerOne', 'WebhookViewer']).toContain(drawRes.body.drawData.winner.username);
  });

  it('reveals the winner and completes giveaway', async () => {
    const revealRes = await request(app)
      .post('/api/giveaway/reveal')
      .set('Authorization', `Bearer ${adminSecret}`)
      .send({});

    expect(revealRes.status).toBe(200);
    expect(revealRes.body.success).toBe(true);
    expect(revealRes.body.giveaway.status).toBe('completed');
    expect(revealRes.body.giveaway.winnerUsername).toBeDefined();
  });

  it('verifies that the completed giveaway is saved to history', async () => {
    const historyRes = await request(app).get('/api/giveaway/history');
    expect(historyRes.status).toBe(200);
    expect(historyRes.body.history.length).toBeGreaterThan(0);
    expect(historyRes.body.history[0].title).toBe('Integration Test Giveaway');
    expect(historyRes.body.history[0].status).toBe('completed');
  });

  it('updates overlay settings and retrieves them', async () => {
    const updateRes = await request(app)
      .post('/api/settings/overlay')
      .set('Authorization', `Bearer ${adminSecret}`)
      .send({
        accentColor: '#f59e0b',
        animationDurationSec: 9.5,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.settings.accentColor).toBe('#f59e0b');
    expect(updateRes.body.settings.animationDurationSec).toBe(9.5);
  });
});
