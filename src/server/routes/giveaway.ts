import { Router } from 'express';
import type { GiveawayService } from '../services/giveawayService.js';
import { requireAdminAuth } from '../middleware/auth.js';
import { CreateGiveawaySchema, UpdateKeywordSchema, RemoveParticipantSchema } from '../../shared/schemas.js';

export function createGiveawayRouter(giveawayService: GiveawayService): Router {
  const router = Router();

  // Active state
  router.get('/active', (req, res) => {
    const snapshot = giveawayService.getStateSnapshot();
    res.json(snapshot);
  });

  // History
  router.get('/history', (req, res) => {
    const history = giveawayService.getStateSnapshot().recentHistory;
    res.json({ history });
  });

  // Create giveaway
  router.post('/create', requireAdminAuth, (req, res) => {
    try {
      const parsed = CreateGiveawaySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
        return;
      }

      const { title, prize, keyword, wheelEnabled, wheelAmounts } = parsed.data;
      const giveaway = giveawayService.createGiveaway(title, prize, keyword, wheelEnabled, wheelAmounts);
      res.status(201).json({ success: true, giveaway });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Update wheel configuration for active giveaway
  router.post('/wheel', requireAdminAuth, (req, res) => {
    try {
      const { wheelEnabled, wheelAmounts } = req.body;
      const active = giveawayService.getActiveGiveaway();
      if (!active) {
        res.status(400).json({ error: 'No active giveaway.' });
        return;
      }
      const updated = giveawayService.updateGiveawayWheel(active.id, Boolean(wheelEnabled), wheelAmounts);
      res.json({ success: true, giveaway: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Open entries
  router.post('/open', requireAdminAuth, (req, res) => {
    try {
      const { giveawayId } = req.body;
      const active = giveawayService.getActiveGiveaway();
      const id = giveawayId || active?.id;

      if (!id) {
        res.status(400).json({ error: 'No giveaway ID provided and no active giveaway exists.' });
        return;
      }

      const giveaway = giveawayService.openGiveaway(id);
      res.json({ success: true, giveaway });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Close entries
  router.post('/close', requireAdminAuth, (req, res) => {
    try {
      const { giveawayId } = req.body;
      const active = giveawayService.getActiveGiveaway();
      const id = giveawayId || active?.id;

      if (!id) {
        res.status(400).json({ error: 'No giveaway ID provided.' });
        return;
      }

      const giveaway = giveawayService.closeGiveaway(id);
      res.json({ success: true, giveaway });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Update entry keyword
  router.post('/keyword', requireAdminAuth, (req, res) => {
    try {
      const parsed = UpdateKeywordSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid keyword', details: parsed.error.format() });
        return;
      }

      const active = giveawayService.getActiveGiveaway();
      if (!active) {
        res.status(400).json({ error: 'No active giveaway.' });
        return;
      }

      const updated = giveawayService.updateKeyword(active.id, parsed.data.keyword);
      res.json({ success: true, giveaway: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Start winner roll animation
  router.post('/draw', requireAdminAuth, (req, res) => {
    try {
      const drawData = giveawayService.startWinnerDraw();
      res.json({ success: true, drawData });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Reveal winner and announce
  router.post('/reveal', requireAdminAuth, (req, res) => {
    try {
      const result = giveawayService.revealWinner();
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Reset for next giveaway
  router.post('/reset', requireAdminAuth, (req, res) => {
    try {
      giveawayService.resetGiveaway();
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Remove participant
  router.post('/participants/remove', requireAdminAuth, (req, res) => {
    try {
      const parsed = RemoveParticipantSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid participant ID' });
        return;
      }

      const active = giveawayService.getActiveGiveaway();
      if (!active) {
        res.status(400).json({ error: 'No active giveaway.' });
        return;
      }

      const removed = giveawayService.removeParticipant(active.id, parsed.data.participantId);
      if (!removed) {
        res.status(404).json({ error: 'Participant not found or already removed.' });
        return;
      }

      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Manually add participant (for streamer testing or manual additions)
  router.post('/participants/manual', requireAdminAuth, (req, res) => {
    try {
      const { username } = req.body;
      if (!username || typeof username !== 'string') {
        res.status(400).json({ error: 'Username is required.' });
        return;
      }

      const participant = giveawayService.manuallyAddParticipant(username);
      res.status(201).json({ success: true, participant });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}
