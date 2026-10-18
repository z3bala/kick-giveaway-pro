import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Check, Sparkles } from 'lucide-react';
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
      // Stage 1: Intense dual side cannons
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6, x: 0.25 },
        colors: [accentColor, '#ffd700', '#ffffff', '#00f0ff'],
      });
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6, x: 0.75 },
        colors: [accentColor, '#ffd700', '#ffffff', '#00f0ff'],
      });

      // Stage 2: Delayed ceiling rain (350ms)
      const timer = setTimeout(() => {
        confetti({
          particleCount: 90,
          angle: 90,
          spread: 100,
          origin: { y: 0.1, x: 0.5 },
          colors: [accentColor, '#ffffff', '#ffd700'],
        });
      }, 350);

      return () => clearTimeout(timer);
    } catch {}
  }, [winner.id, accentColor]);

  return (
    <div className="relative mx-auto max-w-xl w-full p-8 rounded-3xl bg-[#080b12]/95 border-2 shadow-2xl backdrop-blur-2xl animate-scale-in text-center select-none overflow-hidden"
      style={{
        borderColor: `${accentColor}80`,
        boxShadow: `0 0 60px -10px ${accentColor}50, 0 25px 60px -15px rgba(0,0,0,0.9)`,
      }}
    >
      {/* Dynamic Ambient Glow Behind Card */}
      <div
        className="absolute -top-24 -left-24 w-56 h-56 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ backgroundColor: accentColor }}
      />
      <div
        className="absolute -bottom-24 -right-24 w-56 h-56 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ backgroundColor: '#ffd700' }}
      />

      {/* Top Banner Tag */}
      <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full mb-6 border shadow-sm"
        style={{
          backgroundColor: `${accentColor}15`,
          borderColor: `${accentColor}40`,
        }}
      >
        <span
          className="w-2 h-2 rounded-full animate-ping"
          style={{ backgroundColor: accentColor }}
        />
        <span
          className="text-xs font-black uppercase tracking-widest font-sans"
          style={{ color: accentColor }}
        >
          GIVEAWAY WINNER
        </span>
      </div>

      {/* Large Winner Avatar Badge */}
      <div className="relative inline-flex items-center justify-center mb-4">
        {/* Glowing Outer Ring */}
        <div
          className="w-24 h-24 rounded-2xl p-1 flex items-center justify-center shadow-2xl border"
          style={{
            borderColor: `${accentColor}80`,
            boxShadow: `0 0 30px ${accentColor}60`,
            background: `linear-gradient(135deg, ${accentColor}30, rgba(255,255,255,0.05))`,
          }}
        >
          <div className="w-full h-full rounded-xl bg-[#0f1422] flex items-center justify-center font-black text-3xl text-white font-mono border border-white/10">
            {winner.username.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Verified Badge Icon */}
        <div
          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 border-[#080b12]"
          style={{ backgroundColor: accentColor }}
        >
          <Check className="w-4 h-4 text-black stroke-[3]" />
        </div>
      </div>

      {/* Winner Username */}
      <div className="mb-6">
        <h1
          className="text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md truncate px-2"
          style={{
            textShadow: `0 0 30px ${accentColor}80`,
          }}
        >
          @{winner.username}
        </h1>
      </div>

      {/* Prize Showcase Box */}
      <div
        className="w-full p-4 rounded-2xl bg-[#0e1320] border shadow-inner flex flex-col items-center justify-center space-y-1"
        style={{
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
          PRIZE CLAIMED
        </div>
        <div
          className="text-xl sm:text-2xl font-black text-white tracking-tight truncate max-w-full px-2"
          style={{ color: accentColor }}
        >
          {giveaway.prize || giveaway.title}
        </div>
      </div>

      {/* Simple Stream Footer */}
      <div className="mt-6 flex items-center justify-center space-x-2 text-xs font-medium text-neutral-400">
        <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
        <span>{giveaway.participantCount} entrants in pool</span>
        <span>•</span>
        <span className="text-neutral-300">GGs in the chat!</span>
      </div>
    </div>
  );
};
