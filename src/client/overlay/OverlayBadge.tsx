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
    <div className="flex flex-col items-center justify-center p-3 select-none">
      {/* Broadcast Stream Banner */}
      <div className="flex items-center space-x-3.5 px-5 py-3 rounded-xl bg-[#090b12]/90 border border-[#1e2537] shadow-2xl backdrop-blur-md">
        {/* Left Icon Pill */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-sm flex-shrink-0"
          style={{
            background: isOpen
              ? `linear-gradient(135deg, ${settings.accentColor}, #ffb703)`
              : '#202636',
          }}
        >
          <Gift className="w-5 h-5" />
        </div>

        {/* Center Details */}
        <div className="flex flex-col pr-1">
          {settings.showTitle && (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-white tracking-wide truncate max-w-xs font-sans">
                {giveaway.prize || giveaway.title}
              </span>
              <span
                className={`text-[9px] telemetry px-1.5 py-0.5 rounded font-bold uppercase border ${
                  isOpen
                    ? 'bg-[#53fc18]/15 text-[#53fc18] border-[#53fc18]/30 led-beacon'
                    : 'bg-amber-400/15 text-amber-300 border-amber-400/30'
                }`}
              >
                {isOpen ? 'GIVEAWAY ACTIVE' : 'POOL FROZEN'}
              </span>
            </div>
          )}

          {/* Action text */}
          <div className="flex items-center space-x-1.5 mt-0.5">
            {isOpen ? (
              <>
                <MessageSquare className="w-3 h-3 text-neutral-400" />
                <span className="text-[11px] telemetry text-neutral-400">TYPE IN KICK CHAT:</span>
                <span
                  className="text-xs telemetry font-bold px-1.5 py-0.5 rounded text-white shadow-sm"
                  style={{ backgroundColor: settings.accentColor }}
                >
                  {giveaway.keyword}
                </span>
              </>
            ) : isClosed ? (
              <span className="text-[11px] telemetry text-neutral-400">DRAW COMMENCING SHORTLY</span>
            ) : null}
          </div>
        </div>

        {/* Right: Participant Count */}
        {settings.showCount && (
          <div className="pl-3.5 border-l border-[#1f2537] flex items-center space-x-2 flex-shrink-0">
            <Users className="w-3.5 h-3.5 text-neutral-400" />
            <div className="text-right">
              <div className="text-sm font-bold telemetry text-white leading-tight">
                {giveaway.participantCount}
              </div>
              <div className="text-[8px] uppercase tracking-wider text-neutral-400 telemetry">
                ENTRANTS
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Optional Recent Entrant Notification Pill */}
      {settings.showRecentTicker && recentJoined && isOpen && (
        <div className="mt-2 text-[11px] telemetry text-neutral-300 bg-[#0c0f18]/90 px-3 py-1 rounded-full border border-[#1e2538] shadow-md animate-fade-in flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#53fc18] led-beacon" />
          <span className="text-neutral-400">NEW ENTRANT:</span>
          <span className="text-white font-bold">@{recentJoined.username}</span>
        </div>
      )}
    </div>
  );
};
