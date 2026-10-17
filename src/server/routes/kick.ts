import { Router } from 'express';
import crypto from 'node:crypto';
import type { KickBotService, InboundChatMessage } from '../services/kickBot.js';
import type { GiveawayService } from '../services/giveawayService.js';
import { requireAdminAuth } from '../middleware/auth.js';
import { SimulateChatSchema } from '../../shared/schemas.js';

export function createKickRouter(kickBot: KickBotService, giveawayService: GiveawayService): Router {
  const router = Router();

  // Status
  router.get('/status', (req, res) => {
    res.json(kickBot.getState());
  });

  // Connect to Kick chat
  router.post('/connect', requireAdminAuth, async (req, res) => {
    try {
      await kickBot.connect();
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
      const inboundMsg: InboundChatMessage = {
        id: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: userId || `user-${username.toLowerCase()}`,
        username,
        content: message,
        timestamp: new Date().toISOString(),
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

      const body = req.body;
      if (eventType === 'chat.message.sent' || body.event === 'chat.message.sent' || body.content) {
        const inboundMsg: InboundChatMessage = {
          id: body.message_id || body.id || `msg-${Date.now()}`,
          userId: String(body.sender?.user_id || body.sender?.id || body.user_id || 'unknown'),
          username: body.sender?.username || body.username || 'kick_viewer',
          content: body.content || '',
          timestamp: body.created_at || new Date().toISOString(),
        };

        kickBot.handleInboundMessage(inboundMsg);
      }

      // Acknowledge receipt to Kick servers with 200 OK
      res.status(200).json({ received: true });
    } catch (err: any) {
      console.error('[KickWebhook] Error processing webhook:', err.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  });

  return router;
}
