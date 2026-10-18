import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { Participant, Giveaway } from '../../shared/types.js';

interface WinnerCardProps {
  winner: Participant;
  giveaway: Giveaway;
  accentColor?: string;
}

export const WinnerCard: React.FC<WinnerCardProps> = ({
  winner,
  giveaway,
  accentColor = '#53fc18',
}) => {
  useEffect(() => {
    try {
      // Subtle, clean celebratory pop (does not obstruct the streamer's screen)
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.85, x: 0.5 },
        colors: [accentColor, '#ffd700', '#ffffff'],
        ticks: 200,
        gravity: 1.2,
      });
    } catch {}
  }, [winner.id, accentColor]);

  return (
    <div
      className="flex items-center space-x-3.5 px-5 py-2.5 rounded-full bg-[#090d16]/92 border backdrop-blur-xl shadow-2xl select-none animate-scale-in"
      style={{
        borderColor: `${accentColor}50`,
        boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.65), 0 0 20px -3px ${accentColor}30`,
      }}
    >
      {/* Green Pulse Beacon & Winner Label */}
      <div className="flex items-center space-x-2 flex-shrink-0">
        <span
          className="w-2.5 h-2.5 rounded-full animate-ping"
          style={{ backgroundColor: accentColor }}
        />
        <span
          className="text-xs font-mono font-bold tracking-wider uppercase"
          style={{ color: accentColor }}
        >
          WINNER:
        </span>
      </div>

      {/* Full Username - No Truncation */}
      <span className="text-sm font-black text-white font-sans tracking-tight whitespace-nowrap flex-shrink-0">
        @{winner.username}
      </span>

      {/* Divider */}
      <span className="h-4 w-[1px] bg-white/15 flex-shrink-0" />

      {/* Prize Details - Full Text */}
      <div className="flex items-center space-x-1.5 text-xs whitespace-nowrap flex-shrink-0">
        <span className="text-neutral-400 font-medium">Prize:</span>
        <span className="font-bold text-white">
          {giveaway.prize || giveaway.title}
        </span>
      </div>

      {/* Entry Count */}
      {giveaway.participantCount > 0 && (
        <>
          <span className="h-4 w-[1px] bg-white/15 flex-shrink-0" />
          <span className="text-[11px] text-neutral-400 font-mono flex-shrink-0">
            {giveaway.participantCount} entries
          </span>
        </>
      )}
    </div>
  );
};
