import React from 'react';
import {
  Trophy,
  Users,
  Radio,
  KeyRound,
  Gift,
  Play,
  Square,
  Sparkles,
  PlusCircle,
  ExternalLink,
  Clock,
  ArrowRight,
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
  onCreateNew,
}) => {
  const isOpen = giveaway?.status === 'open';
  const isClosed = giveaway?.status === 'closed';
  const isDrawing = giveaway?.status === 'drawing';
  const isCompleted = giveaway?.status === 'completed';

  const statusBadges: Record<string, { label: string; color: string }> = {
    draft: { label: 'Draft', color: 'bg-neutral-800 text-neutral-300 border-neutral-700' },
    open: { label: 'Active / Open', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    closed: { label: 'Entries Closed', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    drawing: { label: 'Drawing Winner', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse' },
    completed: { label: 'Completed', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Quick Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Stream Overview</h2>
          <p className="text-sm text-neutral-400">
            Real-time status of your Kick chat giveaway, bot listener, and OBS overlay.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {giveaway ? (
            <button
              onClick={() => onNavigateTab('controls')}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-surface2 hover:bg-brand-surface3 text-white border border-brand-border transition-all flex items-center space-x-2"
            >
              <span>Manage Giveaway</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onCreateNew}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-md hover:brightness-110 transition-all flex items-center space-x-2"
              style={{ backgroundColor: overlaySettings.accentColor }}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Giveaway</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of 6 Key Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Kick Bot Status */}
        <div className="p-5 rounded-2xl bg-brand-surface border border-brand-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-neutral-400 font-semibold">
              Kick Chat Bot
            </span>
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                kickBot.status === 'connected'
                  ? 'bg-kick-green shadow-kick'
                  : kickBot.status === 'connecting'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-neutral-600'
              }`}
            />
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-white flex items-center space-x-2">
              <Radio className="w-4 h-4 text-neutral-400" />
              <span className="truncate">
                {kickBot.channelSlug ? `@${kickBot.channelSlug}` : 'No Channel'}
              </span>
            </div>
            <div className="text-xs text-neutral-400 mt-1 capitalize flex items-center space-x-1.5">
              <span>Status:</span>
              <span className="font-mono text-neutral-200 font-semibold">{kickBot.status}</span>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('settings')}
            className="mt-4 text-xs text-neutral-400 hover:text-white flex items-center space-x-1 transition-colors"
          >
            <span>Configure Kick credentials</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Card 2: Current Giveaway State */}
        <div className="p-5 rounded-2xl bg-brand-surface border border-brand-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-neutral-400 font-semibold">
              Giveaway Status
            </span>
            <Trophy className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="mt-3">
            {giveaway ? (
              <div>
                <span
                  className={`inline-block text-xs font-mono px-2.5 py-1 rounded-full font-bold border ${
                    statusBadges[giveaway.status]?.color
                  }`}
                >
                  {statusBadges[giveaway.status]?.label}
                </span>
                <div className="text-sm font-semibold text-white mt-2 truncate">
                  {giveaway.title}
                </div>
              </div>
            ) : (
              <div className="text-neutral-500 text-sm italic">No active giveaway running</div>
            )}
          </div>
          <div className="mt-4 text-xs text-neutral-400">
            {isOpen ? '🟢 Viewers can enter now' : '⚪ Waiting for draw or open'}
          </div>
        </div>

        {/* Card 3: Total Participants */}
        <div className="p-5 rounded-2xl bg-brand-surface border border-brand-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-neutral-400 font-semibold">
              Live Entrants
            </span>
            <Users className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white font-mono">
              {giveaway ? giveaway.participantCount : 0}
            </div>
            <div className="text-xs text-neutral-400 mt-1">Verified unique Kick viewers</div>
          </div>
          <button
            onClick={() => onNavigateTab('participants')}
            className="mt-4 text-xs text-neutral-400 hover:text-white flex items-center space-x-1 transition-colors"
          >
            <span>View all participants</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 4: Entry Keyword */}
        <div className="p-5 rounded-2xl bg-brand-surface border border-brand-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-neutral-400 font-semibold">
              Entry Keyword
            </span>
            <KeyRound className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="mt-3">
            <div
              className="inline-block text-xl font-bold font-mono px-3 py-1 rounded-lg text-white shadow-sm"
              style={{ backgroundColor: overlaySettings.accentColor }}
            >
              {giveaway ? giveaway.keyword : '!join'}
            </div>
            <div className="text-xs text-neutral-400 mt-2">Chat command to enter giveaway</div>
          </div>
          <button
            onClick={() => onNavigateTab('controls')}
            className="mt-4 text-xs text-neutral-400 hover:text-white flex items-center space-x-1 transition-colors"
          >
            <span>Change keyword</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 5: Prize */}
        <div className="p-5 rounded-2xl bg-brand-surface border border-brand-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-neutral-400 font-semibold">
              Current Prize
            </span>
            <Gift className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-white truncate">
              {giveaway?.prize || 'No Prize Configured'}
            </div>
            <div className="text-xs text-neutral-400 mt-1">Displayed prominently on OBS</div>
          </div>
          <div className="mt-4 text-xs text-neutral-500 font-mono">
            ID: {giveaway ? giveaway.id.slice(0, 12) : 'N/A'}
          </div>
        </div>

        {/* Card 6: Most Recent Winner */}
        <div className="p-5 rounded-2xl bg-brand-surface border border-brand-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-neutral-400 font-semibold">
              Latest Winner
            </span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            {giveaway?.winnerUsername ? (
              <div>
                <div className="text-xl font-bold text-emerald-400 font-sans truncate">
                  @{giveaway.winnerUsername}
                </div>
                <div className="text-xs text-neutral-400 mt-1">Confirmed Winner</div>
              </div>
            ) : (
              <div className="text-neutral-500 text-sm italic">No winner selected yet</div>
            )}
          </div>
          <button
            onClick={() => onNavigateTab('history')}
            className="mt-4 text-xs text-neutral-400 hover:text-white flex items-center space-x-1 transition-colors"
          >
            <span>View giveaway history</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Quick Action Bar */}
      {giveaway && (
        <div className="p-6 rounded-2xl bg-brand-surface2 border border-brand-border flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white">Quick Streamer Actions</h3>
            <p className="text-xs text-neutral-400">
              Trigger giveaway state transitions without switching tabs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isOpen && !isDrawing && !isCompleted && (
              <button
                onClick={onOpenGiveaway}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-2 transition-all shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Open Registration ({giveaway.keyword})</span>
              </button>
            )}

            {isOpen && (
              <button
                onClick={onCloseGiveaway}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center space-x-2 transition-all shadow-md"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Close Registration</span>
              </button>
            )}

            {(isClosed || isOpen) && (
              <button
                onClick={onStartDraw}
                disabled={giveaway.participantCount === 0}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center space-x-2 transition-all shadow-md ${
                  giveaway.participantCount === 0
                    ? 'opacity-40 cursor-not-allowed bg-neutral-700'
                    : 'hover:brightness-110'
                }`}
                style={{ backgroundColor: overlaySettings.accentColor }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Start CS-Style Draw ({giveaway.participantCount})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Recent Entrants Preview List */}
      <div className="p-6 rounded-2xl bg-brand-surface border border-brand-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-neutral-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Live Participant Stream
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('participants')}
            className="text-xs text-neutral-400 hover:text-white"
          >
            View Full List ({participants.length})
          </button>
        </div>

        {participants.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 text-xs">
            No viewers have entered yet. Open registration or use the Chat Simulator to test.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {participants.slice(0, 12).map((p, idx) => (
              <div
                key={p.id}
                className="flex items-center space-x-2.5 p-2 rounded-xl bg-brand-surface2 border border-brand-border text-xs"
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-[11px]"
                  style={{
                    background: `linear-gradient(135deg, ${overlaySettings.accentColor}, #f59e0b)`,
                  }}
                >
                  {p.username.charAt(0).toUpperCase()}
                </div>
                <div className="truncate font-medium text-neutral-200">{p.username}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
