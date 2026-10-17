import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Gift, Sparkles } from 'lucide-react';
import type { Participant, Giveaway } from '../../shared/types.js';

interface WinnerCardProps {
  winner: Participant;
  giveaway: Giveaway;
  accentColor?: string;
}

export const WinnerCard: React.FC<WinnerCardProps> = ({
  winner,
  giveaway,
  accentColor = '#e11d48',
}) => {
  useEffect(() => {
    // Shoot confetti burst from left and right
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6, x: 0.3 },
        colors: [accentColor, '#f59e0b', '#ffffff', '#53fc18'],
      });
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6, x: 0.7 },
        colors: [accentColor, '#f59e0b', '#ffffff', '#53fc18'],
      });
    } catch {}
  }, [winner.id, accentColor]);

  return (
    <div className="relative mx-auto max-w-xl p-8 rounded-2xl bg-neutral-950/95 border-2 border-neutral-800 shadow-2xl backdrop-blur-xl animate-scale-in text-center overflow-hidden">
      {/* Glow backgrounds */}
      <div
        className="absolute -top-24 -left-24 w-48 h-48 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ backgroundColor: accentColor }}
      />
      <div
        className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full opacity-20 blur-3xl pointer-events-none bg-amber-500"
      />

      {/* Trophy Badge */}
      <div className="relative inline-flex items-center justify-center mb-4">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg border border-white/20"
          style={{
            background: `linear-gradient(135deg, ${accentColor}, #f59e0b)`,
          }}
        >
          <Trophy className="w-10 h-10 text-white drop-shadow-md" />
        </div>
        <div className="absolute -top-2 -right-2 p-1 rounded-full bg-amber-400 text-neutral-950">
          <Sparkles className="w-4 h-4" />
        </div>
      </div>

      <div className="text-xs uppercase tracking-widest font-mono text-neutral-400 font-bold mb-1">
        WINNER REVEALED
      </div>

      {/* Prominent Winner Username */}
      <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-lg mb-4">
        @{winner.username}
      </h1>

      {/* Prize Box */}
      <div className="inline-flex items-center space-x-3 px-5 py-2.5 rounded-xl bg-neutral-900/80 border border-neutral-700/80 shadow-inner">
        <Gift className="w-5 h-5 text-amber-400" />
        <span className="text-neutral-300 font-medium text-sm">Prize:</span>
        <span className="text-white font-bold text-base tracking-wide">{giveaway.prize}</span>
      </div>

      <div className="mt-6 text-xs text-neutral-500 font-mono">
        Chosen from {giveaway.participantCount} entrants • Congratulations!
      </div>
    </div>
  );
};
