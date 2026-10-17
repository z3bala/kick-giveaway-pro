import WebSocket from 'ws';
import { EventEmitter } from 'node:events';
import { KickApiClient } from './kickApi.js';
import type { KickBotState, KickConnectionStatus } from '../../shared/types.js';

export interface KickBotConfig {
  channelSlug: string;
  broadcasterId?: string;
  accessToken?: string;
  clientId?: string;
  clientSecret?: string;
  webhookSecret?: string;
  botReplyEnabled?: boolean;
  botAnnounceWinner?: boolean;
  botChatCooldownMs?: number;
}

export interface InboundChatMessage {
  id: string;
  chatroomId?: string;
  userId: string;
  username: string;
  content: string;
  timestamp: string;
}

export class KickBotService extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private state: KickBotState;
  private config: KickBotConfig;
  private apiClient: KickApiClient;
  private isShuttingDown = false;
  private lastOutboundTime = 0;
  private messageQueue: string[] = [];
  private isProcessingQueue = false;

  constructor(config: KickBotConfig) {
    super();
    this.config = {
      botReplyEnabled: true,
      botAnnounceWinner: true,
      botChatCooldownMs: 1500,
      ...config,
    };
    this.apiClient = new KickApiClient(config.clientId, config.clientSecret, config.accessToken);
    this.state = {
      status: 'disconnected',
      channelSlug: config.channelSlug || 'demo_channel',
      broadcasterId: config.broadcasterId || '',
      lastError: null,
      lastMessageTime: null,
      mode: 'pusher_websocket',
    };
  }

  public getState(): KickBotState {
    return { ...this.state };
  }

  public getApiClient(): KickApiClient {
    return this.apiClient;
  }

  public updateConfig(newConfig: Partial<KickBotConfig>): void {
    const channelChanged = newConfig.channelSlug && newConfig.channelSlug !== this.config.channelSlug;
    this.config = { ...this.config, ...newConfig };
    this.state.channelSlug = this.config.channelSlug;

    if (newConfig.accessToken !== undefined) {
      this.apiClient.setAccessToken(newConfig.accessToken);
    }
    if (newConfig.clientId !== undefined && newConfig.clientSecret !== undefined) {
      this.apiClient.setCredentials(newConfig.clientId, newConfig.clientSecret);
    }

    if (channelChanged && this.state.status === 'connected') {
      this.disconnect();
      this.connect();
    }
  }

  private setStatus(status: KickConnectionStatus, error: string | null = null): void {
    this.state.status = status;
    this.state.lastError = error;
    this.emit('statusChanged', this.getState());
  }

  /**
   * Connects to Kick chat.
   * If real channel credentials/slug exist, resolves chatroom ID and connects to the Pusher WebSocket gateway.
   */
  public async connect(): Promise<void> {
    if (this.state.status === 'connected' || this.state.status === 'connecting') {
      return;
    }

    this.isShuttingDown = false;
    this.setStatus('connecting');

    try {
      // Step 1: Resolve channel and chatroom ID
      const channelInfo = await this.apiClient.getChannelBySlug(this.config.channelSlug);
      if (channelInfo?.broadcaster_user_id) {
        this.config.broadcasterId = channelInfo.broadcaster_user_id;
        this.state.broadcasterId = channelInfo.broadcaster_user_id;
      }

      // Chatroom ID is either the broadcaster ID or channel ID
      const chatroomId = channelInfo?.id || this.config.broadcasterId || '1';

      // Step 2: Connect to Kick's WebSocket chat gateway (Pusher cluster us2)
      // Pusher app key for Kick is standard public client key: eb1d5f283081a78b932c
      const pusherAppKey = 'eb1d5f283081a78b932c';
      const wsUrl = `wss://ws-us2.pusher.com/app/${pusherAppKey}?protocol=7&client=js&version=7.6.0&flash=false`;

      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => {
        // Connected to Pusher gateway, subscribe to the channel's chatroom
        this.startPusherHeartbeat();
      });

      this.ws.on('message', (raw: Buffer | string) => {
        try {
          const text = raw.toString();
          const parsed = JSON.parse(text);

          if (parsed.event === 'pusher:connection_established') {
            const channelName = `chatrooms.${chatroomId}.v2`;
            // Subscribe to channel
            this.ws?.send(
              JSON.stringify({
                event: 'pusher:subscribe',
                data: { auth: '', channel: channelName },
              })
            );
            this.setStatus('connected');
          } else if (parsed.event === 'pusher_internal:subscription_succeeded') {
            this.setStatus('connected');
          } else if (
            parsed.event === 'App\\Events\\ChatMessageEvent' ||
            parsed.event === 'chat.message.sent'
          ) {
            this.handlePusherChatMessage(parsed.data);
          }
        } catch (err: any) {
          console.error('[KickBot] Error parsing WS message:', err.message);
        }
      });

      this.ws.on('error', (err: Error) => {
        console.error('[KickBot] WebSocket error:', err.message);
        this.setStatus('error', err.message);
      });

      this.ws.on('close', (code, reason) => {
        this.clearTimers();
        if (!this.isShuttingDown) {
          this.setStatus('disconnected', `Connection closed (${code})`);
          this.scheduleReconnect();
        }
      });
    } catch (err: any) {
      console.error('[KickBot] Connection failed:', err.message);
      this.setStatus('error', err.message);
      this.scheduleReconnect();
    }
  }

  public disconnect(): void {
    this.isShuttingDown = true;
    this.clearTimers();
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    this.setStatus('disconnected');
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.isShuttingDown) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isShuttingDown && this.state.status !== 'connected') {
        console.log('[KickBot] Attempting to reconnect to Kick chat...');
        this.connect();
      }
    }, 5000);
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private startPusherHeartbeat(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ event: 'pusher:ping', data: {} }));
      }
    }, 25000);
  }

  private handlePusherChatMessage(dataStr: any): void {
    try {
      const data = typeof dataStr === 'string' ? JSON.parse(dataStr) : dataStr;
      const message: InboundChatMessage = {
        id: data.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        chatroomId: String(data.chatroom_id || ''),
        userId: String(data.sender?.id || data.sender?.user_id || data.user_id || data.sender?.username || 'user'),
        username: data.sender?.username || data.sender?.slug || 'anonymous',
        content: String(data.content || '').trim(),
        timestamp: data.created_at || new Date().toISOString(),
      };

      this.state.lastMessageTime = message.timestamp;
      this.emit('chatMessage', message);
    } catch (err: any) {
      console.error('[KickBot] Error handling message event:', err.message);
    }
  }

  /**
   * Handle incoming message from official webhook or simulator
   */
  public handleInboundMessage(message: InboundChatMessage): void {
    this.state.lastMessageTime = message.timestamp;
    this.emit('chatMessage', message);
  }

  /**
   * Queue and send chat reply with rate-limiting
   */
  public async queueChatReply(content: string): Promise<void> {
    if (!this.config.botReplyEnabled) return;
    this.messageQueue.push(content);
    this.processOutboundQueue();
  }

  private async processOutboundQueue(): Promise<void> {
    if (this.isProcessingQueue || this.messageQueue.length === 0) return;
    this.isProcessingQueue = true;

    try {
      while (this.messageQueue.length > 0) {
        const nextMessage = this.messageQueue.shift();
        if (!nextMessage) break;

        const now = Date.now();
        const cooldown = this.config.botChatCooldownMs || 1500;
        const elapsed = now - this.lastOutboundTime;

        if (elapsed < cooldown) {
          await new Promise((resolve) => setTimeout(resolve, cooldown - elapsed));
        }

        const broadcasterId = this.config.broadcasterId || this.state.broadcasterId;
        const sent = await this.apiClient.sendChatMessage(broadcasterId, nextMessage);

        this.lastOutboundTime = Date.now();

        // Emit local bot chat event so dashboard & overlay know a reply was sent
        this.emit('botReplySent', {
          id: `bot-${Date.now()}`,
          username: 'KickGiveawayBot',
          content: nextMessage,
          timestamp: new Date().toISOString(),
          isBot: true,
          deliveredViaApi: sent,
        });
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Announce giveaway opened in Kick chat
   */
  public async announceGiveawayOpened(title: string, prize: string, keyword: string): Promise<void> {
    if (!this.config.botReplyEnabled) return;
    const announcement = `📢 GIVEAWAY STARTED: "${title}"! Prize: ${prize}. Type ${keyword} in chat to enter!`;
    await this.queueChatReply(announcement);
  }

  /**
   * Announce giveaway closed in Kick chat
   */
  public async announceGiveawayClosed(title: string, participantCount: number): Promise<void> {
    if (!this.config.botReplyEnabled) return;
    const announcement = `🛑 GIVEAWAY ENTRIES CLOSED: Entries for "${title}" are now locked (${participantCount} participants). Rolling the winner on stream now!`;
    await this.queueChatReply(announcement);
  }

  /**
   * Announce winner in Kick chat
   */
  public async announceWinner(winnerUsername: string, prize: string): Promise<void> {
    if (!this.config.botAnnounceWinner) return;
    const announcement = `🎉 CONGRATULATIONS @${winnerUsername}! You won the giveaway for "${prize}"! 🏆 Contact the streamer to claim your prize!`;
    await this.queueChatReply(announcement);
  }
}
