import React from 'react';
import {
  Trophy,
  Users,
  Radio,
  KeyRound,
  Gift,
  Play,
  Square,
  Crosshair,
  Plus,
  ArrowRight,
  Shield,
  CircleDot,
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

  return (
    <div className="space-y-6">
      {/* Top Telemetry Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1b1f2e]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#53fc18] led-beacon" />
            <h2 className="text-xl font-black text-white tracking-wider uppercase telemetry">
              Operations Center
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Real-time channel broadcast telemetry, participant pool, and OBS overlay state.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {giveaway ? (
            <button
              onClick={() => onNavigateTab('controls')}
              className="px-4 py-2 rounded-lg text-xs telemetry font-bold bg-[#151926] hover:bg-[#1c2234] text-neutral-200 border border-[#252c42] transition-all flex items-center space-x-2"
            >
              <span>CONTROL DECK</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onCreateNew}
              className="px-4 py-2 rounded-lg text-xs telemetry font-bold text-white shadow-sm hover:brightness-110 transition-all flex items-center space-x-2"
              style={{ backgroundColor: overlaySettings.accentColor }}
            >
              <Plus className="w-4 h-4" />
              <span>INITIALIZE GIVEAWAY</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of 6 Tactical Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* Card 1: Kick Channel Uplink */}
        <div className="p-4 rounded-xl tactical-surface tactical-surface-hover flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] telemetry uppercase text-neutral-400 font-bold tracking-wider">
              UPLINK // KICK CHAT
            </span>
            <div
              className={`w-2 h-2 rounded-full ${
                kickBot.status === 'connected'
                  ? 'bg-[#53fc18] led-beacon'
                  : kickBot.status === 'connecting'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-neutral-600'
              }`}
            />
          </div>
          <div className="mt-3">
            <div className="text-base font-bold text-white flex items-center space-x-2 telemetry truncate">
              <Radio className="w-4 h-4 text-neutral-400" />
              <span>{kickBot.channelSlug ? `@${kickBot.channelSlug}` : 'OFFLINE'}</span>
            </div>
            <div className="text-[11px] telemetry text-neutral-400 mt-1 flex items-center space-x-1.5">
              <span>STATUS:</span>
              <span className="text-neutral-200 font-bold uppercase">{kickBot.status}</span>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('settings')}
            className="mt-3 text-[11px] telemetry text-neutral-400 hover:text-white flex items-center space-x-1 transition-colors"
          >
            <span>CONFIGURE UPLINK CREDENTIALS</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 2: Current Phase */}
        <div className="p-4 rounded-xl tactical-surface tactical-surface-hover flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] telemetry uppercase text-neutral-400 font-bold tracking-wider">
              GIVEAWAY STATE
            </span>
            <Trophy className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="mt-3">
            {giveaway ? (
              <div>
                <span
                  className={`inline-block text-[10px] telemetry px-2.5 py-0.5 rounded font-bold uppercase border ${
                    isOpen
                      ? 'bg-[#53fc18]/15 text-[#53fc18] border-[#53fc18]/30'
                      : isClosed
                      ? 'bg-amber-400/15 text-amber-300 border-amber-400/30'
                      : isDrawing
                      ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse'
                      : isCompleted
                      ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                  }`}
                >
                  PHASE: {giveaway.status.toUpperCase()}
                </span>
                <div className="text-sm font-bold text-white mt-2 truncate">
                  {giveaway.title}
                </div>
              </div>
            ) : (
              <div className="text-neutral-500 text-xs telemetry italic">STANDBY // NO ACTIVE MANIFEST</div>
            )}
          </div>
          <div className="mt-3 text-[11px] telemetry text-neutral-400 flex items-center space-x-1.5">
            <CircleDot className="w-3.5 h-3.5 text-neutral-400" />
            <span>{isOpen ? 'ENTRIES ACCEPTED VIA CHAT' : 'POOL FROZEN OR IDLE'}</span>
          </div>
        </div>

        {/* Card 3: Live Pool Volume */}
        <div className="p-4 rounded-xl tactical-surface tactical-surface-hover flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] telemetry uppercase text-neutral-400 font-bold tracking-wider">
              TOTAL ENTRANTS
            </span>
            <Users className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white telemetry">
              {giveaway ? giveaway.participantCount : 0}
            </div>
            <div className="text-[11px] telemetry text-neutral-400 mt-0.5">
              VERIFIED KICK IDENTITIES
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('participants')}
            className="mt-3 text-[11px] telemetry text-neutral-400 hover:text-white flex items-center space-x-1 transition-colors"
          >
            <span>INSPECT ENTRANT ROSTER</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 4: Keyword Trigger */}
        <div className="p-4 rounded-xl tactical-surface tactical-surface-hover flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] telemetry uppercase text-neutral-400 font-bold tracking-wider">
              ENTRY TRIGGER
            </span>
            <KeyRound className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="mt-3">
            <div
              className="inline-block text-lg font-bold telemetry px-2.5 py-1 rounded text-white shadow-sm"
              style={{ backgroundColor: overlaySettings.accentColor }}
            >
              {giveaway ? giveaway.keyword : '!join'}
            </div>
            <div className="text-[11px] telemetry text-neutral-400 mt-2">
              CHAT COMMAND PARSER
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('controls')}
            className="mt-3 text-[11px] telemetry text-neutral-400 hover:text-white flex items-center space-x-1 transition-colors"
          >
            <span>RECONFIGURE KEYWORD</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 5: Prize Manifest */}
        <div className="p-4 rounded-xl tactical-surface tactical-surface-hover flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] telemetry uppercase text-neutral-400 font-bold tracking-wider">
              PRIZE MANIFEST
            </span>
            <Gift className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <div className="text-base font-bold text-white truncate">
              {giveaway?.prize || 'UNASSIGNED'}
            </div>
            <div className="text-[11px] telemetry text-neutral-400 mt-1">
              OBS BROADCAST ASSET
            </div>
          </div>
          <div className="mt-3 text-[10px] telemetry text-neutral-400">
            HASH: {giveaway ? giveaway.id.slice(0, 14) : 'NULL'}
          </div>
        </div>

        {/* Card 6: Last Victor */}
        <div className="p-4 rounded-xl tactical-surface tactical-surface-hover flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] telemetry uppercase text-neutral-400 font-bold tracking-wider">
              CONFIRMED VICTOR
            </span>
            <Trophy className="w-4 h-4 text-[#53fc18]" />
          </div>
          <div className="mt-3">
            {giveaway?.winnerUsername ? (
              <div>
                <div className="text-xl font-black text-emerald-400 telemetry truncate">
                  @{giveaway.winnerUsername}
                </div>
                <div className="text-[11px] telemetry text-neutral-400 mt-0.5">
                  CRYPTOGRAPHICALLY DRAWN
                </div>
              </div>
            ) : (
              <div className="text-neutral-500 text-xs telemetry italic">NO VICTOR SELECTED</div>
            )}
          </div>
          <button
            onClick={() => onNavigateTab('history')}
            className="mt-3 text-[11px] telemetry text-neutral-400 hover:text-white flex items-center space-x-1 transition-colors"
          >
            <span>VIEW AUDIT ARCHIVE</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Quick Tactical Action Toolbar */}
      {giveaway && (
        <div className="p-4 rounded-xl bg-[#10131d] border border-[#1d2232] flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-white uppercase telemetry tracking-wider">
              TACTICAL MASTER SWITCHES
            </div>
            <div className="text-[11px] text-neutral-400">
              Immediate state overrides without navigating away from the operations center.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {!isOpen && !isDrawing && !isCompleted && (
              <button
                onClick={onOpenGiveaway}
                className="px-4 py-2 rounded-lg text-xs telemetry font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-2 transition-all shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>ARM REGISTRATION ({giveaway.keyword})</span>
              </button>
            )}

            {isOpen && (
              <button
                onClick={onCloseGiveaway}
                className="px-4 py-2 rounded-lg text-xs telemetry font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center space-x-2 transition-all shadow-sm"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>FREEZE REGISTRATION</span>
              </button>
            )}

            {(isClosed || isOpen) && (
              <button
                onClick={onStartDraw}
                disabled={giveaway.participantCount === 0}
                className={`px-5 py-2 rounded-lg text-xs telemetry font-bold text-white flex items-center space-x-2 transition-all shadow-sm ${
                  giveaway.participantCount === 0
                    ? 'opacity-40 cursor-not-allowed bg-neutral-700'
                    : 'hover:brightness-110'
                }`}
                style={{ backgroundColor: overlaySettings.accentColor }}
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>ENGAGE CS2 ROLL ({giveaway.participantCount})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Live Entrants Pool Feed */}
      <div className="p-4 rounded-xl bg-[#0e111a] border border-[#1b202f]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-neutral-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider telemetry">
              LIVE PARTICIPANT POOL TELEMETRY
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('participants')}
            className="text-[11px] telemetry text-neutral-400 hover:text-white"
          >
            VIEW FULL ROSTER ({participants.length})
          </button>
        </div>

        {participants.length === 0 ? (
          <div className="text-center py-10 text-neutral-500 text-xs telemetry">
            ROSTER EMPTY // NO VIEWERS HAVE JOINED THIS MANIFEST
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {participants.slice(0, 12).map((p, idx) => (
              <div
                key={p.id}
                className="flex items-center space-x-2 p-2 rounded-lg bg-[#121622] border border-[#1d2335] text-xs"
              >
                <div
                  className="w-6 h-6 rounded flex items-center justify-center font-bold text-white text-[10px] telemetry flex-shrink-0"
                  style={{ backgroundColor: overlaySettings.accentColor }}
                >
                  {p.username.charAt(0).toUpperCase()}
                </div>
                <div className="truncate font-semibold text-neutral-200 text-[11px] telemetry">
                  {p.username}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
