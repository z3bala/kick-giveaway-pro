import React from 'react';
import {
  Trophy,
  Users,
  Radio,
  Sparkles,
  Gift,
  Play,
  Square,
  ArrowRight,
  Plus,
  KeyRound,
  ExternalLink,
  Dice5,
  RotateCcw,
} from 'lucide-react';
import type { Giveaway, Participant, KickBotState, OverlaySettings } from '../../shared/types.js';

interface OverviewProps {
  giveaway: Giveaway | null;
  participants: Participant[];
  kickBot: KickBotState;
  overlaySettings: OverlaySettings;
  onNavigateTab: (tab: any) => void;
  onOpenGiveaway: () => void;
  onCloseGiveaway: () => void;
  onStartDraw: () => void;
  onRevealWinner?: () => void;
  onCreateNew: () => void;
}

export const Overview: React.FC<OverviewProps> = ({
  giveaway,
  participants,
  kickBot,
  overlaySettings,
  onNavigateTab,
  onOpenGiveaway,
  onCloseGiveaway,
  onStartDraw,
  onRevealWinner,
  onCreateNew,
}) => {
  const isOpen = giveaway?.status === 'open';
  const isClosed = giveaway?.status === 'closed';
  const isDrawing = giveaway?.status === 'drawing';
  const isCompleted = giveaway?.status === 'completed';

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome Card */}
      <div className="relative overflow-hidden rounded-2xl glass-card p-6 md:p-8">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-[#53fc18]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.1] text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  kickBot.status === 'connected' ? 'bg-[#53fc18] animate-live-pulse' : 'bg-neutral-500'
                }`}
              />
              <span className="text-neutral-300 font-medium">
                {kickBot.status === 'connected'
                  ? `Listening to Kick channel @${kickBot.channelSlug}`
                  : 'Connect Kick channel in Settings to auto-detect chat entries'}
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {giveaway ? giveaway.title : 'Welcome to Kick Giveaway Pro'}
            </h2>
            <p className="text-sm text-neutral-400 max-w-xl">
              {giveaway
                ? `Viewers enter in Kick chat by typing "${giveaway.keyword}". Select and reveal winners with our animated CS-style roulette.`
                : 'Create a new giveaway to start collecting entries from your Kick live stream chat.'}
            </p>
          </div>

          {/* Banner Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {!giveaway ? (
              <button
                onClick={onCreateNew}
                className="px-5 py-3 rounded-xl bg-[#53fc18] hover:bg-[#45d914] text-black font-bold text-sm flex items-center space-x-2 transition-all shadow-lg shadow-[#53fc18]/25"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Create First Giveaway</span>
              </button>
            ) : (
              <>
                {!isOpen && !isDrawing && !isCompleted && (
                  <button
                    onClick={onOpenGiveaway}
                    className="px-5 py-2.5 rounded-xl bg-[#53fc18] hover:bg-[#45d914] text-black font-bold text-sm flex items-center space-x-2 transition-all shadow-lg shadow-[#53fc18]/20"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Open Entries ({giveaway.keyword})</span>
                  </button>
                )}

                {isOpen && (
                  <>
                    <button
                      onClick={onCloseGiveaway}
                      className="px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/[0.1] font-semibold text-sm flex items-center space-x-2 transition-all"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Close Entries</span>
                    </button>
                    <button
                      onClick={onStartDraw}
                      disabled={giveaway.participantCount === 0}
                      className={`px-5 py-2.5 rounded-xl bg-[#53fc18] text-black font-bold text-sm flex items-center space-x-2 transition-all shadow-lg shadow-[#53fc18]/20 ${
                        giveaway.participantCount === 0
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:bg-[#45d914]'
                      }`}
                    >
                      <Dice5 className="w-4 h-4" />
                      <span>Start CS Roulette Draw</span>
                    </button>
                  </>
                )}

                {isDrawing && (
                  <button
                    onClick={onRevealWinner}
                    className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm flex items-center space-x-2 transition-all animate-pulse shadow-lg shadow-amber-400/20"
                  >
                    <Trophy className="w-4 h-4" />
                    <span>Reveal Winner Now</span>
                  </button>
                )}

                {isCompleted && (
                  <button
                    onClick={() => onNavigateTab('controls')}
                    className="px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/[0.1] font-semibold text-sm flex items-center space-x-2 transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Start Another Draw</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Entrants */}
        <div className="p-5 rounded-2xl glass-card relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">Total Participants</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {giveaway ? giveaway.participantCount : 0}
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              {isOpen ? 'Active viewers in draw pool' : 'Ready for drawing'}
            </p>
          </div>
        </div>

        {/* Card 2: Status */}
        <div className="p-5 rounded-2xl glass-card relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">Current Status</span>
            <div className="w-8 h-8 rounded-lg bg-[#53fc18]/10 border border-[#53fc18]/20 flex items-center justify-center text-[#53fc18]">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="inline-flex items-center space-x-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isOpen
                    ? 'bg-[#53fc18] animate-live-pulse'
                    : isDrawing
                    ? 'bg-amber-400 animate-pulse'
                    : isCompleted
                    ? 'bg-blue-400'
                    : 'bg-neutral-500'
                }`}
              />
              <span className="text-xl font-bold text-white capitalize">
                {giveaway ? giveaway.status : 'Idle'}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              {isOpen
                ? 'Chat commands accepted'
                : isDrawing
                ? 'Roulette spinning on OBS'
                : isCompleted
                ? 'Winner announced'
                : 'Entries closed'}
            </p>
          </div>
        </div>

        {/* Card 3: Keyword */}
        <div className="p-5 rounded-2xl glass-card relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">Chat Keyword</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-[#53fc18] font-mono tracking-tight">
              {giveaway ? giveaway.keyword : '!join'}
            </div>
            <p className="text-xs text-neutral-400 mt-1">Type in Kick stream chat to join</p>
          </div>
        </div>

        {/* Card 4: Prize */}
        <div className="p-5 rounded-2xl glass-card relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">Prize</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xl font-bold text-white truncate">
              {giveaway?.prize || 'No prize specified'}
            </div>
            <p className="text-xs text-neutral-400 mt-1">Displayed on the OBS overlay</p>
          </div>
        </div>
      </div>

      {/* Winner Spotlight (If revealed) */}
      {giveaway?.winnerUsername && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#53fc18]/15 via-emerald-950/30 to-[#0e121d] border border-[#53fc18]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-[#53fc18] text-black flex items-center justify-center shadow-lg shadow-[#53fc18]/25 flex-shrink-0">
              <Trophy className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#53fc18] uppercase tracking-wider">
                Winner Selected!
              </span>
              <div className="text-xl font-extrabold text-white">
                @{giveaway.winnerUsername}
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Won: {giveaway.prize} • Drawn via cryptographically fair selection
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onNavigateTab('controls')}
              className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/[0.1] text-xs font-semibold transition-all"
            >
              Manage Giveaway
            </button>
          </div>
        </div>
      )}

      {/* Live Participants Grid Preview */}
      <div className="rounded-2xl glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Users className="w-5 h-5 text-[#53fc18]" />
            <div>
              <h3 className="text-base font-bold text-white">Current Participants</h3>
              <p className="text-xs text-neutral-400">
                {participants.length} viewer{participants.length === 1 ? '' : 's'} entered in this giveaway
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('participants')}
            className="text-xs font-semibold text-[#53fc18] hover:underline flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {participants.length === 0 ? (
          <div className="py-10 text-center space-y-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <p className="text-sm text-neutral-400 font-medium">No participants yet</p>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              When viewers type <span className="text-[#53fc18] font-mono font-semibold">{giveaway?.keyword || '!join'}</span> in your Kick chat, they will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {participants.slice(0, 18).map((p) => (
              <div
                key={p.id}
                className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-all"
              >
                <div className="w-7 h-7 rounded-lg bg-[#53fc18]/15 text-[#53fc18] font-bold text-xs flex items-center justify-center flex-shrink-0">
                  {p.username.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-medium text-neutral-200 truncate">
                  {p.username}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
