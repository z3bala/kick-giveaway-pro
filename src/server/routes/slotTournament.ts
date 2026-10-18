import { Router } from 'express';
import type { SlotTournamentService } from '../services/slotTournamentService.js';
import { requireAdminAuth } from '../middleware/auth.js';
import {
  CreateSlotTournamentSchema,
  UpdateTournamentSizeSchema,
  UpdateParticipantsSchema,
  SelectWinnerSchema,
} from '../../shared/schemas.js';

export function createSlotTournamentRouter(tournamentService: SlotTournamentService): Router {
  const router = Router();

  // Public: Get current active tournament & state
  router.get('/active', (req, res) => {
    try {
      const state = tournamentService.getStateSnapshot();
      res.json(state);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Create new tournament manually from dashboard
  router.post('/create', requireAdminAuth, (req, res) => {
    try {
      const parsed = CreateSlotTournamentSchema.parse(req.body);
      const tournament = tournamentService.createTournament(parsed.slotName, parsed.size || 8);
      res.json({ success: true, tournament });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Admin: Update bracket size (8 or 16) during setup
  router.post('/size', requireAdminAuth, (req, res) => {
    try {
      const parsed = UpdateTournamentSizeSchema.parse(req.body);
      const tournament = tournamentService.updateSize(parsed.size);
      res.json({ success: true, tournament });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Admin: Update participant names during setup
  router.post('/participants', requireAdminAuth, (req, res) => {
    try {
      const parsed = UpdateParticipantsSchema.parse(req.body);
      const tournament = tournamentService.updateParticipants(parsed.participants);
      res.json({ success: true, tournament });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Admin: Shuffle participant positions
  router.post('/shuffle', requireAdminAuth, (req, res) => {
    try {
      const tournament = tournamentService.shuffleParticipants();
      res.json({ success: true, tournament });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Admin: Lock bracket and start matches
  router.post('/lock', requireAdminAuth, (req, res) => {
    try {
      const tournament = tournamentService.lockBracket();
      res.json({ success: true, tournament });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Admin: Select winner of a match
  router.post('/winner', requireAdminAuth, (req, res) => {
    try {
      const parsed = SelectWinnerSchema.parse(req.body);
      const result = tournamentService.selectWinner(parsed.matchId, parsed.winnerName, parsed.force || false);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Admin: Re-announce current matchup in Kick chat
  router.post('/announce-current', requireAdminAuth, (req, res) => {
    try {
      const match = tournamentService.announceCurrentMatch();
      res.json({ success: true, match });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Admin: Reset / Cancel active tournament
  router.post('/reset', requireAdminAuth, (req, res) => {
    try {
      tournamentService.resetTournament();
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}
