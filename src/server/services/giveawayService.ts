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
      accentColor: '#53fc18',
      cardStyle: 'modern',
      animationDurationSec: 7.5,
      soundEnabled: true,
      soundVolume: 0.8,
      showTitle: true,
      showCount: true,
      showRecentTicker: true,
      scale: 1,
      position: 'top-right',
      layoutStyle: 'pill',
    });

    // Load app settings
    this.appSettings = dbOps.getSetting<AppSettings>(this.db, 'app_settings', {
      kickChannelSlug: process.env.KICK_CHANNEL_SLUG || 'frixen1',
      kickBroadcasterId: process.env.KICK_BROADCASTER_ID || '29176855',
      kickClientId: process.env.KICK_CLIENT_ID || '01M55MY622GWQP6EA2HSJ4CJTJ',
      kickClientSecretMasked: '••••••••',
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

    // Load persisted secrets from SQLite so they survive restarts
    const persistedToken = dbOps.getSetting<string>(this.db, 'kick_access_token', '') || process.env.KICK_ACCESS_TOKEN || '';
    const persistedSecret = dbOps.getSetting<string>(this.db, 'kick_client_secret', '') || process.env.KICK_CLIENT_SECRET || '4ba04b149cf41010573ec24b3d433cd32fc713b0afc80795ddf1315f933b6179';
    const persistedClientId = dbOps.getSetting<string>(this.db, 'kick_client_id', '') || process.env.KICK_CLIENT_ID || '01M55MY622GWQP6EA2HSJ4CJTJ';

    if (persistedClientId) {
      this.appSettings.kickClientId = persistedClientId;
      process.env.KICK_CLIENT_ID = persistedClientId;
    }
    if (persistedSecret) {
      this.appSettings.kickClientSecretMasked = '••••••••';
      process.env.KICK_CLIENT_SECRET = persistedSecret;
    }
    if (persistedToken) {
      this.appSettings.kickAccessTokenMasked = '••••••••';
      process.env.KICK_ACCESS_TOKEN = persistedToken;
    }

    // Initialize KickBot credentials from env and persistent db
    this.kickBot.updateConfig({
      channelSlug: this.appSettings.kickChannelSlug || 'frixen1',
      broadcasterId: this.appSettings.kickBroadcasterId || '29176855',
      clientId: this.appSettings.kickClientId || process.env.KICK_CLIENT_ID || '01M55MY622GWQP6EA2HSJ4CJTJ',
      clientSecret: persistedSecret || process.env.KICK_CLIENT_SECRET || '4ba04b149cf41010573ec24b3d433cd32fc713b0afc80795ddf1315f933b6179',
      accessToken: persistedToken || process.env.KICK_ACCESS_TOKEN,
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

  public getRawAccessToken(): string {
    return process.env.KICK_ACCESS_TOKEN || dbOps.getSetting<string>(this.db, 'kick_access_token', '') || '';
  }

  // ---------------- Giveaway Lifecycle Operations ----------------

  public createGiveaway(title: string, prize: string, keyword: string): Giveaway {
    const now = new Date().toISOString();
    // Auto-archive any previous active or draft giveaway cleanly
    try {
      this.db.prepare(`UPDATE giveaways SET status = 'completed', completed_at = ? WHERE status IN ('draft', 'open', 'closed', 'drawing')`).run(now);
    } catch (e: any) {
      console.warn('[GiveawayService] Note archiving previous giveaways:', e.message);
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
      createdAt: now,
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

  /**
   * Intelligently matches incoming chat content against giveaway keyword.
   * Handles:
   * - With or without "!" (e.g. !join or join matches either keyword configuration)
   * - Case insensitivity (e.g. !JOIN, Join, JOIN)
   * - Punctuation around keyword (e.g. !join!, !join., :!join)
   * - Multi-word or emote attachments (e.g. "!join [emote:123]", "!join please", "enter !join")
   */
  public matchesKeyword(content: string, configuredKeyword: string): boolean {
    if (!content || !configuredKeyword) return false;

    const cleanContent = content.toLowerCase().trim();
    const cleanKeyword = configuredKeyword.toLowerCase().trim();

    // Base keyword stripped of leading exclamation marks or symbols
    const baseKeyword = cleanKeyword.replace(/^[!#$/:]+/, '').trim();
    if (!baseKeyword) return false;

    // 1. Direct exact or with/without ! match
    if (cleanContent === cleanKeyword || cleanContent === baseKeyword || cleanContent === `!${baseKeyword}`) {
      return true;
    }

    // 2. Tokenize by whitespace
    const tokens = cleanContent.split(/\s+/);
    for (const rawToken of tokens) {
      // Strip outer punctuation: e.g. "!join!" -> "join", ":!join," -> "join"
      const strippedToken = rawToken.replace(/^[^a-z0-9]+/i, '').replace(/[^a-z0-9]+$/i, '');
      if (strippedToken === baseKeyword) {
        return true;
      }
      if (rawToken === cleanKeyword || rawToken === `!${baseKeyword}`) {
        return true;
      }
    }

    // 3. Word boundary regex search (for messages like "yo !join" or "!join! Good luck")
    const escapedBase = baseKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|\\s)[!#$/:]*${escapedBase}(?:[^a-z0-9]|$)`, 'i');
    if (regex.test(cleanContent)) {
      return true;
    }

    return false;
  }

  public handleChatMessage(msg: InboundChatMessage): boolean {
    const active = this.getActiveGiveaway();
    if (!active || active.status !== 'open') {
      return false;
    }

    const rawContent = (msg.content || '').trim();
    if (!rawContent) return false;

    // Check if message matches the entry keyword with maximum flexibility
    const isKeywordMatch = this.matchesKeyword(rawContent, active.keyword);

    if (!isKeywordMatch) {
      return false;
    }

    const rawUsername = (msg.username || 'kick_viewer').trim();
    const cleanUsername = rawUsername.replace(/[\x00-\x1F\x7F]/g, '').trim() || 'kick_viewer';

    // Safe Kick User ID: never allow duplicate collisions like "unknown"
    let effectiveUserId = (msg.userId || '').trim();
    if (!effectiveUserId || effectiveUserId === 'unknown' || effectiveUserId === 'undefined') {
      effectiveUserId = `user_${cleanUsername.toLowerCase()}`;
    }

    // Attempt to register entry
    const participantId = `p-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const participant: Participant = {
      id: participantId,
      giveawayId: active.id,
      kickUserId: effectiveUserId,
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

      console.log(`[Giveaway] Participant @${cleanUsername} entered giveaway "${active.title}" (total: ${active.participantCount})`);

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
    const now = new Date().toISOString();
    try {
      this.db.prepare(`UPDATE giveaways SET status = 'completed', completed_at = ? WHERE status IN ('draft', 'open', 'closed', 'drawing')`).run(now);
    } catch (e: any) {
      console.warn('[GiveawayService] Reset note:', e.message);
    }
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
      dbOps.saveSetting(this.db, 'kick_client_secret', secretValues.clientSecret);
      updated.kickClientSecretMasked = '••••••••';
    }
    if (secretValues?.accessToken) {
      process.env.KICK_ACCESS_TOKEN = secretValues.accessToken;
      dbOps.saveSetting(this.db, 'kick_access_token', secretValues.accessToken);
      updated.kickAccessTokenMasked = '••••••••';
    }
    if (secretValues?.adminSecret) {
      process.env.ADMIN_SECRET = secretValues.adminSecret;
      dbOps.saveSetting(this.db, 'admin_secret', secretValues.adminSecret);
      updated.adminProtected = true;
    }
    if (settings.kickClientId) {
      dbOps.saveSetting(this.db, 'kick_client_id', settings.kickClientId);
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
