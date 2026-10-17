import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Gift, CheckCircle } from 'lucide-react';
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
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.55, x: 0.35 },
        colors: [accentColor, '#ffb703', '#ffffff', '#53fc18'],
      });
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.55, x: 0.65 },
        colors: [accentColor, '#ffb703', '#ffffff', '#53fc18'],
      });
    } catch {}
  }, [winner.id, accentColor]);

  return (
    <div className="relative mx-auto max-w-lg p-7 rounded-2xl bg-[#090b12]/95 border-2 border-[#1f2638] shadow-2xl backdrop-blur-xl animate-scale-in text-center overflow-hidden">
      {/* Background ambient lighting */}
      <div
        className="absolute -top-20 -left-20 w-44 h-44 rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{ backgroundColor: accentColor }}
      />
      <div
        className="absolute -bottom-20 -right-20 w-44 h-44 rounded-full opacity-20 blur-3xl pointer-events-none bg-amber-500"
      />

      {/* Trophy Badge */}
      <div className="relative inline-flex items-center justify-center mb-3">
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg border border-white/20"
          style={{
            background: `linear-gradient(135deg, ${accentColor}, #ffb703)`,
          }}
        >
          <Trophy className="w-8 h-8 text-white drop-shadow-md" />
        </div>
      </div>

      <div className="text-[10px] uppercase tracking-widest telemetry text-neutral-400 font-bold mb-1">
        OFFICIAL GIVEAWAY VICTOR
      </div>

      {/* Winner Handle */}
      <h1 className="text-3xl sm:text-4xl font-black text-white telemetry tracking-tight drop-shadow-md mb-3">
        @{winner.username}
      </h1>

      {/* Prize Manifest Display */}
      <div className="inline-flex items-center space-x-2.5 px-4 py-2 rounded-lg bg-[#111520] border border-[#222a3d] shadow-inner">
        <Gift className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <span className="text-neutral-400 telemetry text-xs font-semibold">PRIZE:</span>
        <span className="text-white font-bold text-sm tracking-wide">{giveaway.prize}</span>
      </div>

      <div className="mt-5 text-[10px] text-neutral-400 telemetry uppercase tracking-wider flex items-center justify-center space-x-1.5">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
        <span>DRAW VERIFIED • {giveaway.participantCount} TOTAL ENTRANTS</span>
      </div>
    </div>
  );
};
