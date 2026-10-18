import React from 'react';
import { Coins, Trophy, Sparkles } from 'lucide-react';
import type { GtbEvent, OverlaySettings } from '../../shared/types.js';

interface GtbOverlayCardProps {
  gtbEvent: GtbEvent;
  settings: OverlaySettings;
}

export const GtbOverlayCard: React.FC<GtbOverlayCardProps> = ({
  gtbEvent,
  settings,
}) => {
  const accent = settings.accentColor || '#53fc18';
  const isResolved = gtbEvent.status === 'resolved';
  const isOpen = gtbEvent.status === 'open';

  // Resolved Winner Spotlight Card (Centered on OBS)
  if (isResolved && gtbEvent.winnerUsername) {
    return (
      <div className="select-none filter drop-shadow-2xl animate-fade-in flex flex-col items-center">
        <div
          className="relative px-8 py-5 rounded-2xl border backdrop-blur-2xl flex flex-col items-center text-center max-w-md"
          style={{
            backgroundColor: 'rgba(9, 13, 24, 0.94)',
            borderColor: `${accent}70`,
            boxShadow: `0 20px 50px -10px rgba(0, 0, 0, 0.8), 0 0 30px -4px ${accent}40`,
          }}
        >
          {/* Top Floating Trophy Badge */}
          <div
            className="w-12 h-12 -mt-10 mb-2 rounded-2xl flex items-center justify-center shadow-lg border"
            style={{
              backgroundColor: '#0c111e',
              borderColor: accent,
              boxShadow: `0 0 20px ${accent}60`,
              color: accent,
            }}
          >
            <Trophy className="w-6 h-6 stroke-[2.5]" />
          </div>

          <div className="text-[11px] font-black uppercase tracking-widest text-[#53fc18]">
            🎰 STAKE.COM • GUESS THE BALANCE
          </div>

          {/* Winner Full Name */}
          <div className="text-2xl font-black text-white mt-1 tracking-tight truncate max-w-sm">
            @{gtbEvent.winnerUsername}
          </div>

          {/* Winning Guess & Actual Balance Stats */}
          <div className="mt-3 grid grid-cols-2 gap-2 w-full">
            <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              <div className="text-[10px] uppercase font-bold text-neutral-400">Final Balance</div>
              <div className="text-base font-black text-white font-mono mt-0.5">
                ${gtbEvent.finalBalance?.toFixed(2)}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              <div className="text-[10px] uppercase font-bold text-neutral-400">Closest Guess</div>
              <div className="text-base font-black font-mono mt-0.5" style={{ color: accent }}>
                ${gtbEvent.winnerGuess?.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Accuracy & Prize */}
          <div className="mt-3 flex items-center space-x-2 text-xs">
            <span className="px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 font-mono text-[11px] font-bold">
              {gtbEvent.winnerDiff === 0 ? 'Exact Match!' : `±$${gtbEvent.winnerDiff?.toFixed(2)} away`}
            </span>
            <span className="text-neutral-400">•</span>
            <span className="text-white font-bold">Prize: {gtbEvent.prize}</span>
          </div>
        </div>
      </div>
    );
  }

  // Live Floating Pill Banner during stream
  return (
    <div className="select-none filter drop-shadow-2xl animate-fade-in">
      <div
        className="flex items-center space-x-3 px-4 py-2 rounded-full border backdrop-blur-xl transition-all"
        style={{
          backgroundColor: 'rgba(8, 12, 22, 0.90)',
          borderColor: isOpen ? `${accent}40` : 'rgba(255, 255, 255, 0.12)',
          boxShadow: `0 8px 30px rgba(0, 0, 0, 0.7), 0 0 16px -2px ${isOpen ? accent : '#000'}30`,
        }}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: isOpen ? `linear-gradient(135deg, ${accent}, #10b981)` : '#334155',
            color: '#000',
            boxShadow: `0 0 10px ${accent}60`,
          }}
        >
          <Coins className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>

        <div className="flex flex-col pr-1">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-white">
              GUESS THE BALANCE
            </span>
            <span
              className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: isOpen ? `${accent}20` : 'rgba(255, 255, 255, 0.1)',
                color: isOpen ? accent : '#94a3b8',
              }}
            >
              {isOpen ? `${gtbEvent.guessCount} Guesses` : 'Locked'}
            </span>
          </div>

          <div className="text-[10px] text-neutral-300 font-mono">
            Type <strong style={{ color: accent }}>{gtbEvent.keyword} &lt;amount&gt;</strong> • Prize:{' '}
            <strong className="text-white font-sans">{gtbEvent.prize}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
