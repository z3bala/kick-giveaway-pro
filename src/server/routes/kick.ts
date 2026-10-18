import { Router } from 'express';
import crypto from 'node:crypto';
import type { KickBotService, InboundChatMessage } from '../services/kickBot.js';
import type { GiveawayService } from '../services/giveawayService.js';
import { requireAdminAuth } from '../middleware/auth.js';
import { SimulateChatSchema } from '../../shared/schemas.js';
import { dbOps } from '../db.js';

export function createKickRouter(kickBot: KickBotService, giveawayService: GiveawayService): Router {
  const router = Router();

  // Status
  router.get('/status', async (req, res) => {
    const baseState = kickBot.getState();
    const token = giveawayService.getRawAccessToken();
    const appSettings = giveawayService.getAppSettings();

    let channelInfo: any = null;
    let authUser: any = null;
    try {
      const [cInfo, uInfo] = await Promise.all([
        kickBot.getApiClient().getChannelBySlug(baseState.channelSlug || 'frixen1'),
        kickBot.getApiClient().getAuthenticatedUser(),
      ]);
      channelInfo = cInfo;
      authUser = uInfo;
    } catch {}

    const isBroadcasterToken = authUser && String(authUser.user_id) === String(baseState.broadcasterId || '29176855');

    res.json({
      ...baseState,
      hasAccessToken: !!token,
      clientIdConfigured: !!(appSettings.kickClientId || process.env.KICK_CLIENT_ID),
      tokenOwner: authUser?.name || null,
      tokenOwnerId: authUser?.user_id || null,
      isBroadcasterToken: !!isBroadcasterToken,
      botBadgeActive: !!token,
      chatroom: channelInfo ? {
        followersMode: channelInfo.followers_mode,
        followingMinDuration: channelInfo.following_min_duration,
        slowMode: channelInfo.slow_mode,
        subscribersMode: channelInfo.subscribers_mode,
        emotesMode: channelInfo.emotes_mode,
      } : null,
    });
  });

  // Who am I (authenticated Kick user verification)
  router.get('/whoami', async (req, res) => {
    try {
      const token = giveawayService.getRawAccessToken();
      if (!token) {
        return res.status(401).json({ error: 'No access token configured.' });
      }
      const response = await fetch('https://api.kick.com/public/v1/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      const data = await response.json();
      res.json({ status: response.status, data });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  const pkceSessions = new Map<string, { verifier: string; expires: number }>();

  // Clean expired PKCE sessions every 10 mins
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of pkceSessions.entries()) {
      if (val.expires < now) pkceSessions.delete(key);
    }
  }, 10 * 60 * 1000);

  function getRedirectUri(req: any): string {
    const configuredAppUrl = process.env.APP_URL || 'https://kick-giveaway-pro.onrender.com';
    const host = req.get('host');
    if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
      const isSecure = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' || host.includes('onrender.com');
      const protocol = isSecure ? 'https' : 'http';
      return `${protocol}://${host}/api/kick/callback`;
    }
    return `${configuredAppUrl.replace(/\/$/, '')}/api/kick/callback`;
  }

  // 1-Click Authorize Endpoint with Stateless Resilient PKCE S256
  router.get('/authorize', (req, res) => {
    const rawClientId = giveawayService.getRawClientId();
    const clientId = (req.query.client_id as string)?.trim() || rawClientId;

    const redirectUri = getRedirectUri(req);

    // Generate RFC 7636 PKCE code_verifier (64 hex characters: zero underscores or fragile delimiters)
    const verifier = crypto.randomBytes(32).toString('hex');
    const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');

    // Stateless Base64URL-encoded state payload storing verifier and exact redirect URI
    const statePayload = Buffer.from(
      JSON.stringify({ v: verifier, r: redirectUri, t: Date.now() })
    ).toString('base64url');

    pkceSessions.set(statePayload, { verifier, expires: Date.now() + 30 * 60 * 1000 });
    try {
      dbOps.saveSetting(giveawayService.getDb(), 'pkce_active_verifier', verifier);
      dbOps.saveSetting(giveawayService.getDb(), 'pkce_active_redirect', redirectUri);
    } catch {}

    const kickAuthUrl = `https://id.kick.com/oauth/authorize?response_type=code&client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(
      'chat:write channel:read user:read'
    )}&code_challenge=${challenge}&code_challenge_method=S256&state=${statePayload}`;

    res.redirect(kickAuthUrl);
  });

  // OAuth Redirect URL callback from Kick Developer Portal
  router.get('/callback', async (req, res) => {
    const { code, state, error, error_description } = req.query;
    if (error) {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Kick Authorization</title></head>
          <body style="background:#090d16;color:#ffffff;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
            <div style="background:#131826;padding:32px;border-radius:16px;border:1px solid rgba(255,255,255,0.1);max-width:440px;text-align:center;">
              <h2 style="color:#f43f5e;margin-top:0;">Authorization Denied</h2>
              <p style="color:#94a3b8;font-size:14px;">${error_description || error}</p>
              <a href="/settings" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#53fc18;color:#000;text-decoration:none;font-weight:bold;border-radius:8px;">Return to Settings</a>
            </div>
          </body>
        </html>
      `);
      return;
    }

    if (code) {
      const stateStr = String(state || '');
      let codeVerifier: string | undefined;
      let originalRedirectUri: string | undefined;

      // 1. Try decoding JSON payload from Base64URL state
      try {
        const decoded = JSON.parse(Buffer.from(stateStr, 'base64url').toString('utf8'));
        if (decoded && decoded.v) {
          codeVerifier = decoded.v;
          originalRedirectUri = decoded.r;
        }
      } catch {}

      // 2. Fallback to in-memory session map
      if (!codeVerifier) {
        const session = pkceSessions.get(stateStr);
        codeVerifier = session?.verifier;
      }

      // 3. Fallback to regex match if older format
      if (!codeVerifier && stateStr.startsWith('pkce_')) {
        const match = stateStr.match(/^pkce_(.+)_\d+$/);
        if (match && match[1]) {
          codeVerifier = match[1];
        }
      }

      // 4. Fallback to persisted database setting
      if (!codeVerifier) {
        try {
          codeVerifier = dbOps.getSetting<string>(giveawayService.getDb(), 'pkce_active_verifier', '') || undefined;
          originalRedirectUri = dbOps.getSetting<string>(giveawayService.getDb(), 'pkce_active_redirect', '') || undefined;
        } catch {}
      }

      if (stateStr) pkceSessions.delete(stateStr);

      const redirectUri = originalRedirectUri || getRedirectUri(req);
      const rawClientId = giveawayService.getRawClientId();
      const rawClientSecret = giveawayService.getRawClientSecret();

      try {
        const result = await kickBot.getApiClient().exchangeAuthCode(
          String(code),
          redirectUri,
          codeVerifier,
          rawClientId,
          rawClientSecret
        );

        if (result.success && result.accessToken) {
          giveawayService.updateAppSettings({}, { accessToken: result.accessToken });
          const broadcasterId = giveawayService.getAppSettings().kickBroadcasterId || '29176855';
          await kickBot.getApiClient().subscribeToChatEvents(broadcasterId);

          // Try to dispatch 1 test message right away to verify chat write capability
          try {
            await kickBot.sendDirectChatMessage('🤖 Kick Giveaway Bot connected and authorized! Ready for live chat giveaways.');
          } catch (testErr) {
            console.warn('[KickOAuth] Post-auth test message note:', testErr);
          }

          res.redirect('/settings?oauth_success=true&bot_tested=true');
          return;
        } else {
          res.send(`
            <!DOCTYPE html>
            <html>
              <head><title>Kick Authorization</title></head>
              <body style="background:#090d16;color:#ffffff;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px;box-sizing:border-box;">
                <div style="background:#131826;padding:32px;border-radius:16px;border:1px solid rgba(255,255,255,0.1);max-width:540px;text-align:center;box-shadow:0 20px 40px rgba(0,0,0,0.8);">
                  <div style="width:48px;height:48px;border-radius:12px;background:rgba(244,63,94,0.15);border:1px solid rgba(244,63,94,0.3);margin:0 auto 16px auto;display:flex;align-items:center;justify-content:center;font-size:22px;color:#f43f5e;">⚠️</div>
                  <h2 style="color:#f43f5e;margin-top:0;font-size:20px;">Kick Token Exchange Failed</h2>
                  <div style="background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:12px 16px;margin:16px 0;text-align:left;font-family:monospace;font-size:12px;color:#cbd5e1;word-break:break-all;">
                    <div style="color:#94a3b8;margin-bottom:4px;"><strong>HTTP Status:</strong> ${result.status || 'N/A'}</div>
                    <div style="color:#fca5a5;"><strong>Kick Error:</strong> ${result.error || 'Code verification failed'}</div>
                  </div>
                  <p style="color:#94a3b8;font-size:13px;line-height:1.5;">
                    If Kick returned <em>invalid_client</em>, verify that your <strong>Client Secret</strong> in Settings matches the secret in <a href="https://dev.kick.com" target="_blank" style="color:#53fc18;">dev.kick.com</a>.
                  </p>
                  <div style="margin-top:24px;display:flex;justify-content:center;gap:12px;flex-wrap:wrap;">
                    <a href="/api/kick/authorize" style="padding:10px 20px;background:#53fc18;color:#000;text-decoration:none;font-weight:bold;border-radius:8px;font-size:13px;">Re-Authorize 1-Click</a>
                    <a href="/settings" style="padding:10px 20px;background:rgba(255,255,255,0.08);color:#fff;text-decoration:none;font-weight:600;border-radius:8px;font-size:13px;">Return to Settings</a>
                  </div>
                </div>
              </body>
            </html>
          `);
          return;
        }
      } catch (err: any) {
        console.error('[KickOAuth] Failed to exchange code for token:', err.message);
      }
    }

    // Return to settings
    res.redirect(`/settings?oauth_code=${encodeURIComponent(String(code || ''))}`);
  });

  // Direct Token Fetch via Client Credentials
  router.post('/exchange-token', requireAdminAuth, async (req, res) => {
    try {
      const token = await kickBot.getApiClient().fetchTokenWithClientCredentials();
      if (token) {
        giveawayService.updateAppSettings({}, { accessToken: token });
        res.json({ success: true, message: 'Access token generated successfully.' });
      } else {
        res.status(400).json({
          error: 'Could not fetch token from Kick. Ensure your Client ID and Client Secret are correct.',
        });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Connect to Kick chat
  router.post('/connect', requireAdminAuth, async (req, res) => {
    try {
      const { channelSlug, broadcasterId } = req.body || {};
      if (channelSlug && typeof channelSlug === 'string' && channelSlug.trim()) {
        const cleanSlug = channelSlug.trim().replace(/^@/, '');
        giveawayService.updateAppSettings({
          kickChannelSlug: cleanSlug,
          kickBroadcasterId: broadcasterId ? String(broadcasterId).trim() : undefined,
        });
        kickBot.disconnect();
        kickBot.updateConfig({
          channelSlug: cleanSlug,
          broadcasterId: broadcasterId ? String(broadcasterId).trim() : undefined,
        });
      }
      await kickBot.connect(true);
      res.json({ success: true, state: kickBot.getState() });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Disconnect from Kick chat
  router.post('/disconnect', requireAdminAuth, (req, res) => {
    kickBot.disconnect();
    res.json({ success: true, state: kickBot.getState() });
  });

  // Simulate chat message for testing and rehearsal
  router.post('/simulate-chat', requireAdminAuth, (req, res) => {
    try {
      const parsed = SimulateChatSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
        return;
      }

      const { username, message, userId } = parsed.data;
      const isOwner = username.toLowerCase() === (kickBot.getState().channelSlug || '').toLowerCase();
      const inboundMsg: InboundChatMessage = {
        id: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: userId || `user-${username.toLowerCase()}`,
        username,
        content: message,
        timestamp: new Date().toISOString(),
        isBroadcaster: isOwner,
        isModerator: isOwner,
        badges: isOwner ? ['broadcaster'] : [],
      };

      // Feed into the bot
      kickBot.handleInboundMessage(inboundMsg);

      res.json({ success: true, message: inboundMsg });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Official Kick Webhook Receiver for chat events: POST /api/kick/webhook
   * Matches Kick Developer Event Subscriptions ('chat.message.sent')
   */
  router.post('/webhook', (req, res) => {
    try {
      const eventType = req.headers['kick-event-type'] || req.headers['kick_event_type'];
      const signature = req.headers['kick-event-signature'] || req.headers['kick_event_signature'] || req.headers['kick-signature'];

      // Note: If KICK_WEBHOOK_SECRET is set, verify HMAC signature
      const webhookSecret = process.env.KICK_WEBHOOK_SECRET;
      if (webhookSecret && signature) {
        // Optional verification if secret is provided
        const hmac = crypto.createHmac('sha256', webhookSecret);
        const digest = hmac.update(JSON.stringify(req.body)).digest('hex');
        if (digest !== signature) {
          console.warn('[KickWebhook] Signature mismatch on incoming webhook payload.');
          res.status(401).json({ error: 'Invalid webhook signature' });
          return;
        }
      }

      const body = req.body || {};
      console.log('[KickWebhook] Received incoming webhook event:', eventType || body.event, 'body keys:', Object.keys(body));
      const payload = body.data || body;
      const content = String(payload.content || body.content || '').trim();

      if (content || eventType === 'chat.message.sent' || body.event === 'chat.message.sent') {
        const sender = payload.sender || body.sender || {};
        const username = sender.username || payload.username || body.username || 'kick_viewer';
        const rawUserId = sender.user_id || sender.id || payload.user_id || body.user_id;
        const userId = rawUserId ? String(rawUserId) : `user_${String(username).toLowerCase().replace(/[^a-z0-9_]/g, '') || Date.now()}`;
        const rawBadges = sender.identity?.badges || sender.badges || [];
        const badges = Array.isArray(rawBadges)
          ? rawBadges.map((b: any) => String(b.type || b.text || b))
          : [];
        const isBroadcaster = sender.identity?.badges?.some((b: any) => b.type === 'broadcaster') || badges.some((b) => b.toLowerCase().includes('broadcaster')) || username.toLowerCase() === (kickBot.getState().channelSlug || '').toLowerCase();
        const isModerator = sender.identity?.badges?.some((b: any) => b.type === 'moderator') || badges.some((b) => b.toLowerCase().includes('moderator') || b.toLowerCase().includes('mod'));

        const inboundMsg: InboundChatMessage = {
          id: String(payload.message_id || payload.id || body.message_id || body.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
          userId,
          username,
          content,
          timestamp: payload.created_at || body.created_at || new Date().toISOString(),
          badges,
          isBroadcaster,
          isModerator,
        };

        console.log(`[KickWebhook] Chat message from @${username}: "${content}"`);
        kickBot.handleInboundMessage(inboundMsg);

        try {
          dbOps.addChatLog(giveawayService.getDb(), {
            id: inboundMsg.id,
            username,
            content,
            timestamp: inboundMsg.timestamp,
            isBot: false,
          });
        } catch (dbErr: any) {
          console.warn('[KickWebhook] Could not log chat to DB:', dbErr.message);
        }
      }

      // Acknowledge receipt to Kick servers with 200 OK
      res.status(200).json({ received: true });
    } catch (err: any) {
      console.error('[KickWebhook] Error processing webhook:', err.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  });

  // Public chat activity & webhook health inspect endpoint
  router.get('/activity', (req, res) => {
    try {
      const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 200);
      const logs = dbOps.getRecentChatLogs(giveawayService.getDb(), limit);
      res.json({
        kickBot: kickBot.getState(),
        activeGiveaway: giveawayService.getActiveGiveaway(),
        recentMessages: logs,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Send 1 test message to verify the bot can write to the Kick live chat
  router.post('/test-chat', async (req, res) => {
    try {
      const { message, type } = req.body || {};
      const preferredType = type === 'user' ? 'user' : 'bot';
      const testContent = message && typeof message === 'string' && message.trim()
        ? message.trim()
        : `🤖 [KickBot Test] Live chat verification from Kick Giveaway Pro! Bot account write confirmed. (${new Date().toLocaleTimeString()})`;

      const result = await kickBot.sendDirectChatMessage(testContent, preferredType);

      if (result.success) {
        try {
          dbOps.addChatLog(giveawayService.getDb(), {
            id: `bot-test-${Date.now()}`,
            username: 'KickGiveawayBot',
            content: testContent,
            timestamp: new Date().toISOString(),
            isBot: true,
          });
        } catch {}
      }

      // Check channel moderation settings to warn if followers-only mode is active
      const channelSlug = kickBot.getState().channelSlug || 'frixen1';
      let chatroomDetails: any = null;
      try {
        const cInfo = await kickBot.getApiClient().getChannelBySlug(channelSlug);
        if (cInfo) {
          chatroomDetails = {
            followersMode: cInfo.followers_mode,
            followingMinDuration: cInfo.following_min_duration,
            warning: cInfo.followers_mode
              ? `Channel @${channelSlug} has Followers-Only Chat active. If the bot message did not appear on stream, ensure your bot account follows @${channelSlug} and type "/mod <BotUsername>" in your stream chat!`
              : null,
          };
        }
      } catch {}

      const statusCode = result.success ? 200 : (result.status && result.status >= 400 && result.status < 600 ? result.status : 400);

      res.status(statusCode).json({
        ...result,
        channelSlug,
        broadcasterId: kickBot.getState().broadcasterId,
        content: testContent,
        typeUsed: result.typeUsed || preferredType,
        chatroomDetails,
        hasAccessToken: !!giveawayService.getRawAccessToken(),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}
