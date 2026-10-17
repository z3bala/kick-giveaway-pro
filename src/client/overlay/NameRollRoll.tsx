import React, { useEffect, useRef, useState } from 'react';
import type { DrawAnimationData } from '../../shared/types.js';
import { sfx } from './soundEffects.js';

interface NameRollProps {
  drawData: DrawAnimationData;
  durationSec?: number;
  soundEnabled?: boolean;
  soundVolume?: number;
  accentColor?: string;
  onComplete?: () => void;
}

export const NameRoll: React.FC<NameRollProps> = ({
  drawData,
  durationSec = 7.5,
  soundEnabled = true,
  soundVolume = 0.8,
  accentColor = '#e11d48',
  onComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [winnerRevealed, setWinnerRevealed] = useState(false);

  const CARD_WIDTH = 180;
  const CARD_GAP = 16;
  const STRIDE = CARD_WIDTH + CARD_GAP;

  useEffect(() => {
    sfx.setConfig(soundEnabled, soundVolume);

    const container = containerRef.current;
    const strip = stripRef.current;
    if (!container || !strip) return;

    const viewportWidth = container.clientWidth || 1000;
    const targetIdx = drawData.targetIndex;

    // Center of target card relative to strip start
    const cardCenter = targetIdx * STRIDE + CARD_WIDTH / 2;
    // Slight organic offset within card boundary (-18px to +18px)
    const organicOffset = ((drawData.startedAt % 37) - 18);
    const finalDistance = cardCenter - (viewportWidth / 2) + organicOffset;

    let animFrame: number;
    const startTime = performance.now();
    const durationMs = (durationSec || drawData.durationSec || 7.5) * 1000;

    let lastTickCardIndex = -1;

    // Natural deceleration easing (accelerates quickly then long smooth glide)
    const easeOutGlide = (t: number): number => {
      return 1 - Math.pow(1 - t, 4.2);
    };

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, Math.max(0, elapsed / durationMs));
      const eased = easeOutGlide(progress);
      const currentX = eased * finalDistance;

      if (strip) {
        strip.style.transform = `translate3d(-${currentX}px, 0, 0)`;
      }

      // Check current card passing center for tick sound
      const currentCenterPos = currentX + viewportWidth / 2;
      const currentCardIdx = Math.floor(currentCenterPos / STRIDE);
      if (currentCardIdx !== lastTickCardIndex && currentCardIdx >= 0 && currentCardIdx < drawData.rollCards.length) {
        lastTickCardIndex = currentCardIdx;
        sfx.playCardTick();
      }

      if (progress < 1) {
        animFrame = requestAnimationFrame(animate);
      } else {
        // Animation finished
        setIsFinished(true);
        sfx.playWinnerChime();
        setTimeout(() => {
          setWinnerRevealed(true);
          onComplete?.();
        }, 600);
      }
    };

    animFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [drawData, durationSec, soundEnabled, soundVolume]);

  return (
    <div className="relative w-full max-w-5xl mx-auto my-6 px-4 select-none">
      {/* Top Banner / Status */}
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <span className="text-xs uppercase font-mono tracking-widest text-neutral-300 font-bold">
            {isFinished ? 'WINNER SELECTED' : 'ROLLING FOR WINNER...'}
          </span>
        </div>
        <div className="text-xs font-mono text-neutral-400">
          {drawData.rollCards.length} Entrants Roll
        </div>
      </div>

      {/* Main Roulette Container */}
      <div
        ref={containerRef}
        className="relative h-44 overflow-hidden rounded-xl border-2 border-neutral-800 bg-neutral-950/90 shadow-2xl backdrop-blur-md"
        style={{
          boxShadow: isFinished
            ? `0 0 35px -5px ${accentColor}80`
            : '0 10px 30px -5px rgba(0,0,0,0.8)',
        }}
      >
        {/* Subtle Horizontal Grid lines / case opening vignette */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-neutral-950 via-transparent to-neutral-950 z-20" />
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/[0.03] to-transparent z-10" />

        {/* Center Target Marker / Reticle */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 z-30 pointer-events-none flex flex-col justify-between items-center">
          {/* Top Arrow Pointer */}
          <div
            className="w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[12px] drop-shadow-md"
            style={{ borderTopColor: accentColor }}
          />

          {/* Vertical Reticle Line */}
          <div
            className="w-[2.5px] h-full shadow-lg animate-reticle"
            style={{
              backgroundColor: accentColor,
              boxShadow: `0 0 10px ${accentColor}`,
            }}
          />

          {/* Bottom Arrow Pointer */}
          <div
            className="w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-b-[12px] drop-shadow-md"
            style={{ borderBottomColor: accentColor }}
          />
        </div>

        {/* Rolling Tape Strip */}
        <div
          ref={stripRef}
          className="flex items-center h-full will-change-transform py-3 px-4"
          style={{ transform: 'translate3d(0, 0, 0)' }}
        >
          {drawData.rollCards.map((card, idx) => {
            const isTargetWinner = idx === drawData.targetIndex;
            const highlight = isFinished && isTargetWinner;

            return (
              <div
                key={card.id}
                className="flex-shrink-0 flex flex-col items-center justify-between h-36 rounded-lg p-3 mx-2 transition-transform duration-300 relative overflow-hidden"
                style={{
                  width: `${CARD_WIDTH}px`,
                  backgroundColor: highlight ? '#1c1f2b' : '#14161f',
                  border: highlight
                    ? `2.5px solid ${accentColor}`
                    : '1.5px solid #282d3d',
                  transform: highlight ? 'scale(1.04)' : 'scale(1)',
                  boxShadow: highlight ? `0 0 25px ${accentColor}90` : 'none',
                }}
              >
                {/* Top card accent line */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{
                    backgroundColor: isTargetWinner ? accentColor : '#3d445c',
                  }}
                />

                {/* Avatar Badge */}
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-inner border border-white/10 mt-1"
                  style={{
                    background: isTargetWinner
                      ? `linear-gradient(135deg, ${accentColor}, #f59e0b)`
                      : `linear-gradient(135deg, #2b3245, #181d2a)`,
                  }}
                >
                  {card.username.charAt(0).toUpperCase()}
                </div>

                {/* Username */}
                <div className="w-full text-center px-1">
                  <div className="text-sm font-semibold truncate text-neutral-100 font-sans">
                    {card.username}
                  </div>
                  <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                    {isTargetWinner && isFinished ? '★ WINNER ★' : `Entry #${idx + 1}`}
                  </div>
                </div>

                {/* Card Tier Indicator Bar */}
                <div
                  className="w-full h-1.5 rounded-full"
                  style={{
                    backgroundColor: isTargetWinner ? accentColor : '#252a39',
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
