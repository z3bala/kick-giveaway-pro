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

      const current = giveawayService.getAppSettings();
      const updated = giveawayService.updateAppSettings(
        {
          kickChannelSlug: data.kickChannelSlug ?? current.kickChannelSlug,
          kickBroadcasterId: data.kickBroadcasterId ?? current.kickBroadcasterId,
          kickClientId: data.kickClientId ?? current.kickClientId,
          defaultKeyword: data.defaultKeyword ?? current.defaultKeyword,
          botReplyEnabled: data.botReplyEnabled ?? current.botReplyEnabled,
          botAnnounceWinner: data.botAnnounceWinner ?? current.botAnnounceWinner,
          botChatCooldownMs: data.botChatCooldownMs ?? current.botChatCooldownMs,
          requireFollower: data.requireFollower ?? current.requireFollower,
          minAccountAgeDays: data.minAccountAgeDays ?? current.minAccountAgeDays,
          overlayToken: data.overlayToken ?? current.overlayToken,
          botWinnerTemplate: data.botWinnerTemplate ?? current.botWinnerTemplate,
          botOpenedTemplate: data.botOpenedTemplate ?? current.botOpenedTemplate,
          botClosedTemplate: data.botClosedTemplate ?? current.botClosedTemplate,
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
