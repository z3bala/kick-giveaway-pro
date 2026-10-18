import { Router } from 'express';
import type { GtbService } from '../services/gtbService.js';
import { requireAdminAuth } from '../middleware/auth.js';
import { CreateGtbEventSchema, ResolveGtbEventSchema, ManualGtbGuessSchema } from '../../shared/schemas.js';

export function createGtbRouter(gtbService: GtbService): Router {
  const router = Router();

  // Get active GTB event & guesses
  router.get('/status', (req, res) => {
    try {
      const snapshot = gtbService.getStateSnapshot();
      res.json(snapshot);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create & open a new GTB event
  router.post('/create', requireAdminAuth, (req, res) => {
    try {
      const parsed = CreateGtbEventSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
        return;
      }

      const { title, prize, keyword } = parsed.data;
      const event = gtbService.createEvent(title, prize, keyword);
      res.json({ success: true, event });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Close guesses (lock predictions before final spins)
  router.post('/close', requireAdminAuth, (req, res) => {
    try {
      const { eventId } = req.body;
      const event = gtbService.closeEvent(eventId);
      res.json({ success: true, event });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Resolve event: "Closest Prediction" button
  router.post('/resolve', requireAdminAuth, (req, res) => {
    try {
      const parsed = ResolveGtbEventSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
        return;
      }

      const { finalBalance, eventId } = parsed.data;
      const result = gtbService.resolveClosestPrediction(finalBalance, eventId);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Reset event for next stream
  router.post('/reset', requireAdminAuth, (req, res) => {
    try {
      gtbService.resetEvent();
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Streamer manually enters a viewer's guess
  router.post('/guess/manual', requireAdminAuth, (req, res) => {
    try {
      const parsed = ManualGtbGuessSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
        return;
      }

      const { username, guess } = parsed.data;
      const { guess: savedGuess, isNew } = gtbService.recordGuess(username, guess);

      if (!isNew) {
        res.status(400).json({
          error: `@${username} has already guessed $${savedGuess.guess.toFixed(2)}. Viewers can only guess once and cannot change their prediction.`,
        });
        return;
      }

      res.json({ success: true, guess: savedGuess });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}
