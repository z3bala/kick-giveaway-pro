import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import { dbOps } from '../db.js';
import { selectWinnerUniformly } from './winnerPicker.js';
import type { KickBotService, InboundChatMessage } from './kickBot.js';
import type {
  Giveaway,
  Participant,
  DrawAnimationData,
  OverlaySettings,
  AppSettings,
  StateSyncPayload,
} from '../../shared/types.js';

export interface GiveawayServiceEvents {
  emitEvent: (event: string, data: any) => void;
}

export class GiveawayService {
  private activeGiveaway: Giveaway | null = null;
  private activeDraw: DrawAnimationData | null = null;
  private overlaySettings: OverlaySettings;
  private appSettings: AppSettings;
  private lastJoinNotificationTime = 0;

  constructor(
    private db: DatabaseSync,
    private kickBot: KickBotService,
    private broadcaster: GiveawayServiceEvents
  ) {
    // Load persisted active giveaway from SQLite
    this.activeGiveaway = dbOps.getActiveGiveaway(this.db);

    // Load persisted overlay settings or use defaults
    this.overlaySettings = dbOps.getSetting<OverlaySettings>(this.db, 'overlay_settings', {
      theme: 'dark',
      accentColor: '#e11d48',
      cardStyle: 'modern',
      animationDurationSec: 7.5,
      soundEnabled: true,
      soundVolume: 0.8,
      showTitle: true,
      showCount: true,
      showRecentTicker: true,
      scale: 1,
    });

    // Load app settings
    this.appSettings = dbOps.getSetting<AppSettings>(this.db, 'app_settings', {
      kickChannelSlug: process.env.KICK_CHANNEL_SLUG || 'demo_channel',
      kickBroadcasterId: process.env.KICK_BROADCASTER_ID || '',
      kickClientId: process.env.KICK_CLIENT_ID || '',
      kickClientSecretMasked: process.env.KICK_CLIENT_SECRET ? '••••••••' : '',
      kickAccessTokenMasked: process.env.KICK_ACCESS_TOKEN ? '••••••••' : '',
      defaultKeyword: process.env.DEFAULT_ENTRY_KEYWORD || '!join',
      botReplyEnabled: process.env.BOT_REPLY_ENABLED !== 'false',
      botAnnounceWinner: process.env.BOT_ANNOUNCE_WINNER !== 'false',
      botChatCooldownMs: Number(process.env.BOT_CHAT_COOLDOWN_MS || 1500),
      requireFollower: false,
      minAccountAgeDays: 0,
      overlayToken: process.env.OVERLAY_TOKEN || 'streamer-obs-overlay-key-2026',
      adminProtected: !!process.env.ADMIN_SECRET,
    });

    if (process.env.KICK_CLIENT_ID) {
      this.appSettings.kickClientId = process.env.KICK_CLIENT_ID;
    }
    if (process.env.KICK_CLIENT_SECRET) {
      this.appSettings.kickClientSecretMasked = '••••••••';
    }
    if (process.env.KICK_ACCESS_TOKEN) {
      this.appSettings.kickAccessTokenMasked = '••••••••';
    }

    // Initialize KickBot credentials from env if present
    this.kickBot.updateConfig({
      clientId: process.env.KICK_CLIENT_ID,
      clientSecret: process.env.KICK_CLIENT_SECRET,
      accessToken: process.env.KICK_ACCESS_TOKEN,
    });

    // Wire KickBot incoming chat messages
    this.kickBot.on('chatMessage', (msg: InboundChatMessage) => {
      this.handleChatMessage(msg);
    });

    this.kickBot.on('statusChanged', (status) => {
      this.broadcaster.emitEvent('kick.connection.changed', status);
    });
  }

  // ---------------- State Synchronization ----------------

  public getActiveGiveaway(): Giveaway | null {
    if (!this.activeGiveaway || this.activeGiveaway.status === 'completed') {
      this.activeGiveaway = dbOps.getActiveGiveaway(this.db);
    }
    if (this.activeGiveaway) {
      this.activeGiveaway.participantCount = dbOps.getActiveParticipants(this.db, this.activeGiveaway.id).length;
    }
    return this.activeGiveaway;
  }

  public getStateSnapshot(): StateSyncPayload {
    const active = this.getActiveGiveaway();
    const participants = active
      ? dbOps.getParticipants(this.db, active.id)
      : [];

    const recentHistory = dbOps.getGiveawayHistory(this.db, 15);

    return {
      giveaway: active,
      participants,
      kickBot: this.kickBot.getState(),
      overlaySettings: this.overlaySettings,
      activeDraw: this.activeDraw,
      recentHistory,
    };
  }

  public getDb(): DatabaseSync {
    return this.db;
  }

  public getOverlaySettings(): OverlaySettings {
    return { ...this.overlaySettings };
  }

  public getAppSettings(): AppSettings {
    return { ...this.appSettings };
  }

  // ---------------- Giveaway Lifecycle Operations ----------------

  public createGiveaway(title: string, prize: string, keyword: string): Giveaway {
    if (this.activeGiveaway && ['open', 'drawing'].includes(this.activeGiveaway.status)) {
      throw new Error('An active giveaway is currently running. Please close or complete it first.');
    }

    const id = `gw-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const newGw = dbOps.createGiveaway(this.db, {
      id,
      title: title.trim(),
      prize: prize.trim(),
      keyword: keyword.trim().toLowerCase(),
      status: 'draft',
      winnerId: null,
      winnerUsername: null,
      createdAt: new Date().toISOString(),
      openedAt: null,
      closedAt: null,
      completedAt: null,
    });

    this.activeGiveaway = newGw;
    this.activeDraw = null;

    this.broadcaster.emitEvent('giveaway.created', newGw);
    return newGw;
  }

  public openGiveaway(id: string): Giveaway {
    const gw = this.ensureGiveaway(id);
    if (gw.status === 'open') {
      return gw;
    }
    if (gw.status === 'drawing' || gw.status === 'completed') {
      throw new Error(`Cannot open giveaway in '${gw.status}' state.`);
    }

    const openedAt = new Date().toISOString();
    dbOps.updateGiveawayStatus(this.db, id, 'open', { openedAt });
    gw.status = 'open';
    gw.openedAt = openedAt;

    this.broadcaster.emitEvent('giveaway.opened', gw);

    if (this.appSettings.botReplyEnabled) {
      this.kickBot.announceGiveawayOpened(gw.title, gw.prize, gw.keyword);
    }

    return gw;
  }

  public closeGiveaway(id: string): Giveaway {
    const gw = this.ensureGiveaway(id);
    if (gw.status === 'closed') {
      return gw;
    }
    if (gw.status !== 'open') {
      throw new Error(`Cannot close giveaway when status is '${gw.status}'.`);
    }

    const closedAt = new Date().toISOString();
    dbOps.updateGiveawayStatus(this.db, id, 'closed', { closedAt });
    gw.status = 'closed';
    gw.closedAt = closedAt;

    this.broadcaster.emitEvent('giveaway.closed', gw);

    if (this.appSettings.botReplyEnabled) {
      this.kickBot.announceGiveawayClosed(gw.title, gw.participantCount);
    }

    return gw;
  }

  public updateKeyword(id: string, keyword: string): Giveaway {
    const gw = this.ensureGiveaway(id);
    const sanitized = keyword.trim().toLowerCase();
    dbOps.updateGiveawayKeyword(this.db, id, sanitized);
    gw.keyword = sanitized;

    this.broadcaster.emitEvent('giveaway.updated', gw);
    return gw;
  }

  // ---------------- Participant Entry Logic ----------------

  public handleChatMessage(msg: InboundChatMessage): boolean {
    const active = this.getActiveGiveaway();
    if (!active || active.status !== 'open') {
      return false;
    }

    const content = msg.content.trim();
    const keyword = active.keyword.toLowerCase();

    // Check if message matches the entry keyword (e.g. "!join" or "!join please")
    const words = content.toLowerCase().split(/\s+/);
    const isKeywordMatch = words[0] === keyword;

    if (!isKeywordMatch) {
      return false;
    }

    // Attempt to register entry
    const participantId = `p-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const cleanUsername = msg.username.replace(/[^a-zA-Z0-9_]/g, '') || msg.username;

    const participant: Participant = {
      id: participantId,
      giveawayId: active.id,
      kickUserId: msg.userId || cleanUsername.toLowerCase(),
      username: cleanUsername,
      joinedAt: new Date().toISOString(),
      status: 'active',
    };

    const added = dbOps.addParticipant(this.db, participant);

    if (added) {
      active.participantCount += 1;
      this.broadcaster.emitEvent('participant.joined', {
        participant,
        totalParticipants: active.participantCount,
      });

      // Confirm in chat (throttled to avoid flooding)
      const now = Date.now();
      if (now - this.lastJoinNotificationTime > 2000) {
        this.lastJoinNotificationTime = now;
        this.kickBot.queueChatReply(`✅ @${participant.username} entered the giveaway! (${active.participantCount} entrants)`);
      }

      return true;
    }

    return false;
  }

  public manuallyAddParticipant(username: string): Participant {
    if (!this.activeGiveaway) {
      throw new Error('No active giveaway exists.');
    }

    const cleanUsername = username.trim().replace(/[^a-zA-Z0-9_]/g, '');
    if (!cleanUsername) {
      throw new Error('Invalid username.');
    }

    const participantId = `p-manual-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const participant: Participant = {
      id: participantId,
      giveawayId: this.activeGiveaway.id,
      kickUserId: `manual-${cleanUsername.toLowerCase()}`,
      username: cleanUsername,
      joinedAt: new Date().toISOString(),
      status: 'active',
    };

    const added = dbOps.addParticipant(this.db, participant);
    if (!added) {
      throw new Error(`User @${cleanUsername} is already registered in this giveaway.`);
    }

    this.activeGiveaway.participantCount += 1;
    this.broadcaster.emitEvent('participant.joined', {
      participant,
      totalParticipants: this.activeGiveaway.participantCount,
    });

    return participant;
  }

  public removeParticipant(giveawayId: string, participantId: string): boolean {
    const success = dbOps.removeParticipant(this.db, giveawayId, participantId);
    if (success && this.activeGiveaway && this.activeGiveaway.id === giveawayId) {
      this.activeGiveaway.participantCount = Math.max(0, this.activeGiveaway.participantCount - 1);
      this.broadcaster.emitEvent('participant.removed', {
        participantId,
        giveawayId,
        totalParticipants: this.activeGiveaway.participantCount,
      });
    }
    return success;
  }

  // ---------------- Winner Selection & CS-Style Draw ----------------

  public startWinnerDraw(): DrawAnimationData {
    if (!this.activeGiveaway) {
      throw new Error('No active giveaway to draw from.');
    }

    if (this.activeGiveaway.status === 'drawing') {
      throw new Error('A draw animation is already currently in progress.');
    }

    if (this.activeGiveaway.status === 'completed') {
      throw new Error('This giveaway has already completed. Create or reset a new giveaway.');
    }

    // Fetch snapshot of eligible active participants
    const eligible = dbOps.getActiveParticipants(this.db, this.activeGiveaway.id);
    if (eligible.length === 0) {
      throw new Error('Cannot start draw: No eligible participants entered the giveaway.');
    }

    // Auto-close if still open
    if (this.activeGiveaway.status === 'open') {
      this.closeGiveaway(this.activeGiveaway.id);
    }

    // Execute cryptographically unbiased selection
    const duration = this.overlaySettings.animationDurationSec || 7.5;
    const { winner, drawData } = selectWinnerUniformly(this.activeGiveaway.id, eligible, duration);

    this.activeDraw = drawData;
    this.activeGiveaway.status = 'drawing';
    dbOps.updateGiveawayStatus(this.db, this.activeGiveaway.id, 'drawing');

    // Broadcast draw.started to both dashboard and OBS overlay simultaneously
    this.broadcaster.emitEvent('draw.started', drawData);

    return drawData;
  }

  public revealWinner(): { winner: Participant; giveaway: Giveaway } {
    if (!this.activeGiveaway || !this.activeDraw) {
      throw new Error('No active draw in progress to reveal.');
    }

    const winner = this.activeDraw.winner;
    const completedAt = new Date().toISOString();

    dbOps.setGiveawayWinner(this.db, this.activeGiveaway.id, winner.id, winner.username, completedAt);
    this.activeGiveaway.status = 'completed';
    this.activeGiveaway.winnerId = winner.id;
    this.activeGiveaway.winnerUsername = winner.username;
    this.activeGiveaway.completedAt = completedAt;

    this.broadcaster.emitEvent('winner.revealed', {
      winner,
      giveaway: this.activeGiveaway,
    });

    // Announce in Kick chat if enabled
    if (this.appSettings.botAnnounceWinner) {
      this.kickBot.announceWinner(winner.username, this.activeGiveaway.prize);
    }

    return { winner, giveaway: this.activeGiveaway };
  }

  public resetGiveaway(): void {
    this.activeGiveaway = null;
    this.activeDraw = null;
    this.broadcaster.emitEvent('giveaway.reset', {});
  }

  // ---------------- Settings Updates ----------------

  public updateOverlaySettings(settings: Partial<OverlaySettings>): OverlaySettings {
    this.overlaySettings = { ...this.overlaySettings, ...settings };
    dbOps.saveSetting(this.db, 'overlay_settings', this.overlaySettings);
    this.broadcaster.emitEvent('overlay.settings.updated', this.overlaySettings);
    return this.overlaySettings;
  }

  public updateAppSettings(settings: Partial<AppSettings>, secretValues?: { clientSecret?: string; accessToken?: string; adminSecret?: string }): AppSettings {
    const updated = { ...this.appSettings, ...settings };

    if (secretValues?.clientSecret) {
      process.env.KICK_CLIENT_SECRET = secretValues.clientSecret;
      updated.kickClientSecretMasked = '••••••••';
    }
    if (secretValues?.accessToken) {
      process.env.KICK_ACCESS_TOKEN = secretValues.accessToken;
      updated.kickAccessTokenMasked = '••••••••';
    }
    if (secretValues?.adminSecret) {
      process.env.ADMIN_SECRET = secretValues.adminSecret;
      updated.adminProtected = true;
    }

    this.appSettings = updated;
    dbOps.saveSetting(this.db, 'app_settings', {
      ...this.appSettings,
      kickClientSecretMasked: this.appSettings.kickClientSecretMasked,
      kickAccessTokenMasked: this.appSettings.kickAccessTokenMasked,
    });

    // Update kick bot config
    this.kickBot.updateConfig({
      channelSlug: this.appSettings.kickChannelSlug,
      broadcasterId: this.appSettings.kickBroadcasterId,
      botReplyEnabled: this.appSettings.botReplyEnabled,
      botAnnounceWinner: this.appSettings.botAnnounceWinner,
      botChatCooldownMs: this.appSettings.botChatCooldownMs,
      accessToken: process.env.KICK_ACCESS_TOKEN,
      clientId: this.appSettings.kickClientId,
      clientSecret: process.env.KICK_CLIENT_SECRET,
    });

    this.broadcaster.emitEvent('app.settings.updated', this.appSettings);
    return this.appSettings;
  }

  private ensureGiveaway(id: string): Giveaway {
    if (!this.activeGiveaway || this.activeGiveaway.id !== id) {
      const gw = dbOps.getGiveawayById(this.db, id);
      if (!gw) {
        throw new Error(`Giveaway ${id} not found.`);
      }
      this.activeGiveaway = gw;
    }
    return this.activeGiveaway;
  }
}
