import React, { useEffect, useState } from 'react';
import { Gift, Users, MessageSquare, Sparkles, Radio, CheckCircle2 } from 'lucide-react';
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
  const accent = settings.accentColor || '#53fc18';
  const layout = settings.layoutStyle || 'pill';
  const position = settings.position || 'top-right';

  const isBottom = position.startsWith('bottom');
  const isRight = position.endsWith('right');
  const isLeft = position.endsWith('left');
  const alignClass = isRight ? 'items-end' : isLeft ? 'items-start' : 'items-center';

  // Real-time entrant toast state with auto-dismiss after 4 seconds
  const [activeToast, setActiveToast] = useState<Participant | null>(null);

  useEffect(() => {
    if (recentJoined && isOpen) {
      setActiveToast(recentJoined);
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [recentJoined?.id, isOpen]);

  // Toast Component
  const renderToast = () => {
    if (!settings.showRecentTicker || !activeToast || !isOpen) return null;
    return (
      <div
        className={`${isBottom ? 'mb-2' : 'mt-2'} text-[11px] font-sans text-white px-3.5 py-1 rounded-full border shadow-lg backdrop-blur-md flex items-center space-x-2 animate-fade-in`}
        style={{
          backgroundColor: 'rgba(12, 16, 26, 0.94)',
          borderColor: `${accent}50`,
          boxShadow: `0 4px 16px -2px ${accent}30`,
        }}
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: accent, boxShadow: `0 0 6px ${accent}` }}
        />
        <span className="text-neutral-300 font-medium">New Entry:</span>
        <span className="font-bold text-white tracking-wide">@{activeToast.username}</span>
        <CheckCircle2 className="w-3 h-3 text-[#53fc18]" />
      </div>
    );
  };

  // ---------------- Render Layout: Floating Streamer Pill (Default) ----------------
  if (layout === 'pill') {
    return (
      <div className={`flex ${isBottom ? 'flex-col-reverse' : 'flex-col'} ${alignClass} select-none filter drop-shadow-2xl`}>
        <div
          className="flex items-center space-x-3 px-4 py-2.5 rounded-full backdrop-blur-xl border transition-all duration-300"
          style={{
            backgroundColor: 'rgba(9, 13, 22, 0.90)',
            borderColor: `${accent}40`,
            boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.65), 0 0 18px -2px ${accent}30`,
          }}
        >
          {/* Glowing Status Icon */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 shadow-md"
            style={{
              background: isOpen
                ? `linear-gradient(135deg, ${accent}, #10b981)`
                : 'linear-gradient(135deg, #f59e0b, #d97706)',
              boxShadow: `0 0 12px ${accent}60`,
            }}
          >
            {isOpen ? (
              <Gift className="w-4 h-4 text-black stroke-[2.5]" />
            ) : (
              <Radio className="w-4 h-4 text-black stroke-[2.5]" />
            )}
          </div>

          {/* Prize and Live Status */}
          <div className="flex flex-col pr-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black tracking-wide text-white font-sans truncate max-w-[220px]">
                {giveaway.prize || giveaway.title}
              </span>
              <span
                className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full flex items-center space-x-1"
                style={{
                  backgroundColor: isOpen ? `${accent}20` : 'rgba(245, 158, 11, 0.2)',
                  color: isOpen ? accent : '#fbbf24',
                  border: `1px solid ${isOpen ? `${accent}50` : 'rgba(245, 158, 11, 0.4)'}`,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-ping mr-0.5"
                  style={{ backgroundColor: isOpen ? accent : '#fbbf24' }}
                />
                <span>{isOpen ? 'GIVEAWAY' : 'LOCKED'}</span>
              </span>
            </div>

            {/* Keyword Action Callout */}
            <div className="flex items-center space-x-1.5 mt-0.5 text-[11px]">
              {isOpen ? (
                <>
                  <span className="text-neutral-400 font-medium">Type in chat:</span>
                  <span
                    className="font-mono font-black text-black px-2 py-0.5 rounded text-[11px] shadow-sm tracking-wider"
                    style={{ backgroundColor: accent }}
                  >
                    {giveaway.keyword}
                  </span>
                </>
              ) : (
                <span className="text-neutral-400 font-medium">Entries closed • Rolling soon</span>
              )}
            </div>
          </div>

          {/* Entrant Counter Pill */}
          {settings.showCount && (
            <div
              className="pl-3 py-0.5 border-l flex items-center space-x-2 flex-shrink-0"
              style={{ borderColor: 'rgba(255, 255, 255, 0.12)' }}
            >
              <div className="w-6 h-6 rounded-full bg-white/[0.08] flex items-center justify-center text-neutral-300">
                <Users className="w-3.5 h-3.5 text-neutral-300" />
              </div>
              <div className="text-left">
                <div
                  className="text-sm font-black font-mono leading-none"
                  style={{ color: accent }}
                >
                  {giveaway.participantCount}
                </div>
                <div className="text-[8px] font-bold uppercase tracking-wider text-neutral-400 font-sans">
                  ENTRANTS
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Real-Time Entrant Notification Toast */}
        {renderToast()}
      </div>
    );
  }

  // ---------------- Render Layout: Broadcast Esports Bar ----------------
  if (layout === 'bar') {
    return (
      <div className={`flex ${isBottom ? 'flex-col-reverse' : 'flex-col'} ${alignClass} select-none filter drop-shadow-2xl w-full max-w-2xl px-2`}>
        <div
          className="w-full flex items-center justify-between px-5 py-3 rounded-xl backdrop-blur-2xl border"
          style={{
            backgroundColor: 'rgba(10, 14, 24, 0.92)',
            borderColor: `${accent}45`,
            boxShadow: `0 12px 40px -4px rgba(0, 0, 0, 0.75), 0 0 20px -4px ${accent}30`,
          }}
        >
          {/* Left: Badge Icon + Live Tag */}
          <div className="flex items-center space-x-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
              style={{
                background: `linear-gradient(135deg, ${accent}, #059669)`,
                boxShadow: `0 0 16px ${accent}50`,
              }}
            >
              <Sparkles className="w-4 h-4 text-black stroke-[2.5]" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black text-white tracking-tight uppercase">
                  LIVE GIVEAWAY
                </span>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}` }}
                />
              </div>
              <div className="text-sm font-bold text-neutral-200 truncate max-w-sm">
                {giveaway.prize || giveaway.title}
              </div>
            </div>
          </div>

          {/* Center / Right: Command & Counter */}
          <div className="flex items-center space-x-4">
            {isOpen && (
              <div className="flex items-center space-x-1.5 text-xs bg-black/60 px-3 py-1.5 rounded-lg border border-white/[0.08]">
                <MessageSquare className="w-3.5 h-3.5 text-neutral-400" />
                <span className="text-neutral-400 font-medium">Type:</span>
                <span
                  className="font-mono font-black px-1.5 py-0.5 rounded text-black text-xs"
                  style={{ backgroundColor: accent }}
                >
                  {giveaway.keyword}
                </span>
              </div>
            )}

            {settings.showCount && (
              <div className="flex items-center space-x-2 bg-white/[0.06] px-3.5 py-1.5 rounded-lg border border-white/[0.08]">
                <Users className="w-4 h-4 text-neutral-400" />
                <div className="text-right">
                  <span className="text-sm font-black font-mono text-white leading-none">
                    {giveaway.participantCount}
                  </span>
                  <span className="text-[9px] text-neutral-400 uppercase font-bold ml-1">
                    ENTRIES
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Real-time ticker */}
        {renderToast()}
      </div>
    );
  }

  // ---------------- Render Layout: Modern Corner HUD Card ----------------
  return (
    <div className={`flex ${isBottom ? 'flex-col-reverse' : 'flex-col'} ${alignClass} select-none filter drop-shadow-2xl max-w-xs w-full`}>
      <div
        className="w-full p-4 rounded-2xl backdrop-blur-2xl border flex flex-col space-y-3"
        style={{
          backgroundColor: 'rgba(11, 15, 26, 0.94)',
          borderColor: `${accent}40`,
          boxShadow: `0 16px 48px -8px rgba(0, 0, 0, 0.8), 0 0 24px -4px ${accent}30`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div className="flex items-center space-x-2">
            <span
              className="w-2 h-2 rounded-full animate-ping"
              style={{ backgroundColor: accent }}
            />
            <span className="text-[11px] font-black uppercase tracking-wider text-white">
              {isOpen ? 'GIVEAWAY LIVE' : 'ENTRIES CLOSED'}
            </span>
          </div>
          <Gift className="w-4 h-4" style={{ color: accent }} />
        </div>

        {/* Prize */}
        <div>
          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
            PRIZE POOL
          </div>
          <div className="text-base font-black text-white font-sans tracking-tight truncate mt-0.5">
            {giveaway.prize || giveaway.title}
          </div>
        </div>

        {/* Command Callout */}
        {isOpen && (
          <div className="p-2.5 rounded-xl bg-black/60 border border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs text-neutral-300 font-medium">
              <MessageSquare className="w-3.5 h-3.5 text-neutral-400" />
              <span>Chat keyword:</span>
            </div>
            <span
              className="font-mono font-black text-black px-2.5 py-1 rounded-lg text-xs tracking-wider shadow-sm"
              style={{ backgroundColor: accent }}
            >
              {giveaway.keyword}
            </span>
          </div>
        )}

        {/* Footer Counter */}
        {settings.showCount && (
          <div className="flex items-center justify-between pt-1 text-xs text-neutral-300">
            <span className="text-neutral-400 font-medium">Total Entries:</span>
            <span className="font-mono font-bold text-white text-sm">
              {giveaway.participantCount}
            </span>
          </div>
        )}
      </div>

      {/* Real-time Ticker */}
      {renderToast()}
    </div>
  );
};
