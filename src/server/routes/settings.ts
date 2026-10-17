import { Router } from 'express';
import type { GiveawayService } from '../services/giveawayService.js';
import { requireAdminAuth } from '../middleware/auth.js';
import { UpdateOverlaySettingsSchema, UpdateAppSettingsSchema } from '../../shared/schemas.js';

export function createSettingsRouter(giveawayService: GiveawayService): Router {
  const router = Router();

  // Overlay settings
  router.get('/overlay', (req, res) => {
    res.json(giveawayService.getOverlaySettings());
  });

  router.post('/overlay', requireAdminAuth, (req, res) => {
    try {
      const parsed = UpdateOverlaySettingsSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
        return;
      }

      const updated = giveawayService.updateOverlaySettings(parsed.data);
      res.json({ success: true, settings: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // App settings
  router.get('/app', (req, res) => {
    res.json(giveawayService.getAppSettings());
  });

  router.post('/app', requireAdminAuth, (req, res) => {
    try {
      const parsed = UpdateAppSettingsSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
        return;
      }

      const data = parsed.data;
      const secretValues = {
        clientSecret: data.kickClientSecret,
        accessToken: data.kickAccessToken,
        adminSecret: data.adminSecret,
      };

      const updated = giveawayService.updateAppSettings(
        {
          kickChannelSlug: data.kickChannelSlug,
          kickBroadcasterId: data.kickBroadcasterId || '',
          kickClientId: data.kickClientId || '',
          defaultKeyword: data.defaultKeyword || '!join',
          botReplyEnabled: data.botReplyEnabled ?? true,
          botAnnounceWinner: data.botAnnounceWinner ?? true,
          botChatCooldownMs: data.botChatCooldownMs ?? 1500,
          requireFollower: data.requireFollower ?? false,
          minAccountAgeDays: data.minAccountAgeDays ?? 0,
          overlayToken: data.overlayToken || 'streamer-obs-overlay-key-2026',
        },
        secretValues
      );

      res.json({ success: true, settings: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
