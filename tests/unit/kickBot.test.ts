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
});
