import { z } from 'zod';

export const CreateGiveawaySchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title cannot exceed 100 characters'),
  prize: z.string().min(1, 'Prize is required').max(100, 'Prize cannot exceed 100 characters'),
  keyword: z
    .string()
    .min(1, 'Keyword is required')
    .max(30, 'Keyword cannot exceed 30 characters')
    .regex(/^![a-zA-Z0-9_-]+$/, 'Keyword must start with ! and contain only alphanumeric characters, dashes, or underscores'),
  wheelEnabled: z.boolean().optional(),
  wheelAmounts: z.array(z.string()).optional(),
});

export const UpdateKeywordSchema = z.object({
  keyword: z
    .string()
    .min(1, 'Keyword is required')
    .max(30, 'Keyword cannot exceed 30 characters')
    .regex(/^![a-zA-Z0-9_-]+$/, 'Keyword must start with ! and contain only alphanumeric characters, dashes, or underscores'),
});

export const RemoveParticipantSchema = z.object({
  participantId: z.string().min(1, 'Participant ID is required'),
});

export const UpdateOverlaySettingsSchema = z.object({
  theme: z.enum(['dark', 'midnight', 'esports']).optional(),
  accentColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color').optional(),
  cardStyle: z.enum(['modern', 'cyber', 'minimal']).optional(),
  animationDurationSec: z.number().min(3).max(20).optional(),
  soundEnabled: z.boolean().optional(),
  soundVolume: z.number().min(0).max(1).optional(),
  showTitle: z.boolean().optional(),
  showCount: z.boolean().optional(),
  showRecentTicker: z.boolean().optional(),
  scale: z.number().min(0.5).max(2).optional(),
  position: z.enum(['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right', 'center']).optional(),
  layoutStyle: z.enum(['pill', 'bar', 'card']).optional(),
  wheelEnabled: z.boolean().optional(),
  wheelAmounts: z.array(z.string()).optional(),
});

export const UpdateAppSettingsSchema = z.object({
  kickChannelSlug: z.string().max(50).optional(),
  kickBroadcasterId: z.string().optional(),
  kickClientId: z.string().optional(),
  kickClientSecret: z.string().optional(),
  kickAccessToken: z.string().optional(),
  kickWebhookSecret: z.string().optional(),
  defaultKeyword: z.string().regex(/^![a-zA-Z0-9_-]+$/).optional(),
  botReplyEnabled: z.boolean().optional(),
  botAnnounceWinner: z.boolean().optional(),
  botChatCooldownMs: z.number().min(200).max(10000).optional(),
  requireFollower: z.boolean().optional(),
  minAccountAgeDays: z.number().min(0).max(365).optional(),
  overlayToken: z.string().min(6).optional(),
  adminSecret: z.string().optional(),
  botWinnerTemplate: z.string().max(500).optional(),
  botOpenedTemplate: z.string().max(500).optional(),
  botClosedTemplate: z.string().max(500).optional(),
});

export const SimulateChatSchema = z.object({
  username: z.string().min(1).max(40),
  message: z.string().min(1).max(500),
  userId: z.string().optional(),
});

export const CreateGtbEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  prize: z.string().min(1, 'Prize is required').max(100),
  keyword: z.string().min(1).max(30).regex(/^![a-zA-Z0-9_-]+$/).optional(),
});

export const ResolveGtbEventSchema = z.object({
  eventId: z.string().optional(),
  finalBalance: z.number().min(0, 'Balance must be non-negative'),
});

export const ManualGtbGuessSchema = z.object({
  username: z.string().min(1).max(40),
  guess: z.number().min(0, 'Guess must be non-negative'),
});

export const CreateSlotTournamentSchema = z.object({
  slotName: z.string().min(1, 'Slot name is required').max(100, 'Slot name cannot exceed 100 characters'),
  size: z.union([z.literal(8), z.literal(16)]).optional(),
});

export const UpdateTournamentSizeSchema = z.object({
  size: z.union([z.literal(8), z.literal(16)]),
});

export const UpdateParticipantsSchema = z.object({
  participants: z.array(z.string().min(1, 'Participant name cannot be blank')),
});

export const SelectWinnerSchema = z.object({
  matchId: z.string().min(1, 'Match ID is required'),
  winnerName: z.string().min(1, 'Winner name is required'),
  force: z.boolean().optional(),
});


