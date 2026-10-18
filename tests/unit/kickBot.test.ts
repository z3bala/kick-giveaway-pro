import { describe, it, expect, vi } from 'vitest';
import { KickBotService, InboundChatMessage } from '../../src/server/services/kickBot.js';

describe('KickBotService & Event Handling', () => {
  it('initializes in disconnected state with channel configuration', () => {
    const bot = new KickBotService({ channelSlug: 'cool_streamer' });
    const state = bot.getState();

    expect(state.status).toBe('disconnected');
    expect(state.channelSlug).toBe('cool_streamer');
    expect(state.mode).toBe('pusher_websocket');
  });

  it('emits chatMessage event on inbound messages', async () => {
    const bot = new KickBotService({ channelSlug: 'test_channel' });
    const receivedMessages: InboundChatMessage[] = [];

    bot.on('chatMessage', (msg) => {
      receivedMessages.push(msg);
    });

    const testMsg: InboundChatMessage = {
      id: 'msg-1',
      userId: '12345',
      username: 'KickSuperFan',
      content: '!join the giveaway',
      timestamp: new Date().toISOString(),
    };

    bot.handleInboundMessage(testMsg);

    expect(receivedMessages.length).toBe(1);
    expect(receivedMessages[0].username).toBe('KickSuperFan');
    expect(receivedMessages[0].content).toBe('!join the giveaway');
    expect(bot.getState().lastMessageTime).toBe(testMsg.timestamp);
  });

  it('updates configuration dynamically without recreating the bot', () => {
    const bot = new KickBotService({ channelSlug: 'initial_channel' });
    expect(bot.getState().channelSlug).toBe('initial_channel');

    bot.updateConfig({
      channelSlug: 'updated_channel',
      botChatCooldownMs: 2000,
    });

    expect(bot.getState().channelSlug).toBe('updated_channel');
  });

  it('emits botReplySent event when queuing chat reply', async () => {
    const bot = new KickBotService({
      channelSlug: 'test_channel',
      botReplyEnabled: true,
      botChatCooldownMs: 50,
    });

    const replies: any[] = [];
    bot.on('botReplySent', (reply) => {
      replies.push(reply);
    });

    await bot.queueChatReply('Testing bot reply message');

    expect(replies.length).toBe(1);
    expect(replies[0].content).toBe('Testing bot reply message');
    expect(replies[0].isBot).toBe(true);
  });

  it('formats winner announcement properly', async () => {
    const bot = new KickBotService({
      channelSlug: 'test_channel',
      botAnnounceWinner: true,
      botChatCooldownMs: 50,
    });

    const replies: any[] = [];
    bot.on('botReplySent', (reply) => {
      replies.push(reply);
    });

    await bot.announceWinner('LuckyViewer123', '$50 Steam Card');

    expect(replies.length).toBe(1);
    expect(replies[0].content).toContain('@LuckyViewer123');
    expect(replies[0].content).toContain('$50 Steam Card');
  });

  it('sends chat message with type "bot" by default to show [BOT] badge', async () => {
    const { KickApiClient } = await import('../../src/server/services/kickApi.js');
    const client = new KickApiClient('mock_id', 'mock_secret', 'mock_access_token');

    let capturedPayload: any = null;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockImplementation(async (url: any, options: any) => {
      capturedPayload = JSON.parse(options.body);
      return new Response(JSON.stringify({ success: true, message: 'Message sent' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as any;

    try {
      const res = await client.sendChatMessage('29176855', 'Hello from giveaway bot!');
      expect(res.success).toBe(true);
      expect(res.typeUsed).toBe('bot');
      expect(capturedPayload).toEqual({
        type: 'bot',
        content: 'Hello from giveaway bot!',
        broadcaster_user_id: 29176855,
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('retries as bot without broadcaster_user_id if rejected, preserving bot badge', async () => {
    const { KickApiClient } = await import('../../src/server/services/kickApi.js');
    const client = new KickApiClient('mock_id', 'mock_secret', 'mock_access_token');

    let callCount = 0;
    const payloads: any[] = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockImplementation(async (url: any, options: any) => {
      callCount++;
      const payload = JSON.parse(options.body);
      payloads.push(payload);
      if (callCount === 1) {
        // First attempt with broadcaster_user_id rejected
        return new Response(JSON.stringify({ error: 'broadcaster_user_id not allowed for bot' }), {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      // Second attempt without broadcaster_user_id succeeds
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as any;

    try {
      const res = await client.sendChatMessage('29176855', 'Test self-bot message');
      expect(res.success).toBe(true);
      expect(res.typeUsed).toBe('bot');
      expect(callCount).toBe(2);
      expect(payloads[0].type).toBe('bot');
      expect(payloads[0].broadcaster_user_id).toBe(29176855);
      expect(payloads[1].type).toBe('bot');
      expect(payloads[1].broadcaster_user_id).toBeUndefined();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

