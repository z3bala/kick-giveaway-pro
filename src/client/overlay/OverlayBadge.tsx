import React from 'react';
import { Gift, Users, MessageSquare } from 'lucide-react';
import type { Giveaway, Participant, OverlaySettings } from '../../shared/types.js';

interface OverlayBadgeProps {
  giveaway: Giveaway;
  settings: OverlaySettings;
  recentJoined?: Participant | null;
}

export const OverlayBadge: React.FC<OverlayBadgeProps> = ({
  giveaway,
  settings,
  recentJoined,
}) => {
  const isOpen = giveaway.status === 'open';
  const isClosed = giveaway.status === 'closed';

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {/* Main Glassmorphic Widget Container */}
      <div className="flex items-center space-x-4 px-6 py-3.5 rounded-2xl bg-neutral-950/85 border border-neutral-800 shadow-2xl backdrop-blur-xl">
        {/* Left Icon */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0"
          style={{
            background: isOpen
              ? `linear-gradient(135deg, ${settings.accentColor}, #f59e0b)`
              : '#2a2f40',
          }}
        >
          <Gift className="w-6 h-6" />
        </div>

        {/* Center Details */}
        <div className="flex flex-col pr-2">
          {settings.showTitle && (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-white tracking-wide truncate max-w-xs">
                {giveaway.prize || giveaway.title}
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                  isOpen
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {isOpen ? 'GIVEAWAY LIVE' : 'ENTRIES CLOSED'}
              </span>
            </div>
          )}

          {/* Action text */}
          <div className="flex items-center space-x-2 mt-1">
            {isOpen ? (
              <>
                <MessageSquare className="w-3.5 h-3.5 text-neutral-400" />
                <span className="text-xs text-neutral-300">Type in chat to enter:</span>
                <span
                  className="text-xs font-mono font-bold px-2 py-0.5 rounded-md text-white shadow-sm"
                  style={{ backgroundColor: settings.accentColor }}
                >
                  {giveaway.keyword}
                </span>
              </>
            ) : isClosed ? (
              <span className="text-xs text-neutral-400">Selecting winner shortly...</span>
            ) : null}
          </div>
        </div>

        {/* Right: Participant Count */}
        {settings.showCount && (
          <div className="pl-4 border-l border-neutral-800 flex items-center space-x-2 flex-shrink-0">
            <Users className="w-4 h-4 text-neutral-400" />
            <div className="text-right">
              <div className="text-base font-bold font-mono text-white leading-tight">
                {giveaway.participantCount}
              </div>
              <div className="text-[9px] uppercase tracking-wider text-neutral-500 font-mono">
                Entrants
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Optional Recent Entrant Toast */}
      {settings.showRecentTicker && recentJoined && isOpen && (
        <div className="mt-2 text-xs font-mono text-neutral-300 bg-neutral-900/80 px-3 py-1 rounded-full border border-neutral-800 shadow-md animate-fade-in flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>New entrant:</span>
          <span className="text-white font-bold">@{recentJoined.username}</span>
        </div>
      )}
    </div>
  );
};
