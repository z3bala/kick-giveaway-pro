export type GiveawayStatus = 'draft' | 'open' | 'closed' | 'drawing' | 'completed';

export interface Participant {
  id: string;
  giveawayId: string;
  kickUserId: string;
  username: string;
  joinedAt: string;
  status: 'active' | 'removed';
}

export interface Giveaway {
  id: string;
  title: string;
  prize: string;
  keyword: string;
  status: GiveawayStatus;
  winnerId: string | null;
  winnerUsername: string | null;
  participantCount: number;
  createdAt: string;
  openedAt: string | null;
  closedAt: string | null;
  completedAt: string | null;
  wheelEnabled?: boolean;
  wheelAmounts?: string[];
  rolledPrize?: string | null;
}

export interface DrawRollCard {
  id: string;
  username: string;
  isWinner: boolean;
  avatarSeed: number;
}

export interface DrawAnimationData {
  giveawayId: string;
  winner: Participant;
  rollCards: DrawRollCard[];
  targetIndex: number;
  durationSec: number;
  startedAt: number;
  wheelEnabled?: boolean;
  wheelSegments?: string[];
  rolledPrize?: string;
  wheelTargetIndex?: number;
  wheelDurationSec?: number;
}

export type KickConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface KickBotState {
  status: KickConnectionStatus;
  channelSlug: string;
  broadcasterId: string;
  lastError: string | null;
  lastMessageTime: string | null;
  mode: 'official_webhook' | 'pusher_websocket' | 'simulator';
}

export interface OverlaySettings {
  theme: 'dark' | 'midnight' | 'esports';
  accentColor: string;
  cardStyle: 'modern' | 'cyber' | 'minimal';
  animationDurationSec: number;
  soundEnabled: boolean;
  soundVolume: number;
  showTitle: boolean;
  showCount: boolean;
  showRecentTicker: boolean;
  scale: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'center';
  layoutStyle?: 'pill' | 'bar' | 'card';
  wheelEnabled?: boolean;
  wheelAmounts?: string[];
}

export interface AppSettings {
  kickChannelSlug: string;
  kickBroadcasterId: string;
  kickClientId: string;
  kickClientSecretMasked: string;
  kickAccessTokenMasked: string;
  defaultKeyword: string;
  botReplyEnabled: boolean;
  botAnnounceWinner: boolean;
  botChatCooldownMs: number;
  requireFollower: boolean;
  minAccountAgeDays: number;
  overlayToken: string;
  adminProtected: boolean;
  botWinnerTemplate?: string;
  botOpenedTemplate?: string;
  botClosedTemplate?: string;
  defaultWheelAmounts?: string[];
}

export interface StateSyncPayload {
  giveaway: Giveaway | null;
  participants: Participant[];
  kickBot: KickBotState;
  overlaySettings: OverlaySettings;
  activeDraw: DrawAnimationData | null;
  recentHistory: Giveaway[];
  gtb?: GtbStatePayload;
}

export interface ChatMessage {
  id: string;
  username: string;
  content: string;
  timestamp: string;
  isBot?: boolean;
}

// ---------------- Guess The Balance (GTB) Event Types ----------------
export type GtbStatus = 'open' | 'closed' | 'resolved';

export interface GtbGuess {
  id: string;
  eventId: string;
  kickUserId: string;
  username: string;
  guess: number;
  diff?: number;
  createdAt: string;
  updatedAt: string;
}

export interface GtbEvent {
  id: string;
  title: string;
  prize: string;
  keyword: string;
  status: GtbStatus;
  finalBalance: number | null;
  winnerId: string | null;
  winnerUsername: string | null;
  winnerGuess: number | null;
  winnerDiff: number | null;
  guessCount: number;
  createdAt: string;
  closedAt: string | null;
  resolvedAt: string | null;
}

export interface GtbStatePayload {
  activeEvent: GtbEvent | null;
  guesses: GtbGuess[];
  recentEvents: GtbEvent[];
}

