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
  accentColor = '#e63946',
  onComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [isFinished, setIsFinished] = useState(false);

  const CARD_WIDTH = 190;
  const CARD_GAP = 14;
  const STRIDE = CARD_WIDTH + CARD_GAP;

  // CS tier colors for visual variety across the roulette
  const tierColors = ['#eb4b4b', '#d32ce6', '#8847ff', '#4b69ff'];

  useEffect(() => {
    sfx.setConfig(soundEnabled, soundVolume);

    const container = containerRef.current;
    const strip = stripRef.current;
    if (!container || !strip) return;

    const viewportWidth = container.clientWidth || 1000;
    const targetIdx = drawData.targetIndex;

    const cardCenter = targetIdx * STRIDE + CARD_WIDTH / 2;
    const organicOffset = (drawData.startedAt % 33) - 16;
    const finalDistance = cardCenter - viewportWidth / 2 + organicOffset;

    let animFrame: number;
    const startTime = performance.now();
    const durationMs = (durationSec || drawData.durationSec || 7.5) * 1000;

    let lastTickCardIndex = -1;

    // Authentic CS case-opening deceleration curve
    const easeOutGlide = (t: number): number => {
      return 1 - Math.pow(1 - t, 4.3);
    };

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, Math.max(0, elapsed / durationMs));
      const eased = easeOutGlide(progress);
      const currentX = eased * finalDistance;

      if (strip) {
        strip.style.transform = `translate3d(-${currentX}px, 0, 0)`;
      }

      // Check card passing center reticle for mechanical click
      const currentCenterPos = currentX + viewportWidth / 2;
      const currentCardIdx = Math.floor(currentCenterPos / STRIDE);
      if (currentCardIdx !== lastTickCardIndex && currentCardIdx >= 0 && currentCardIdx < drawData.rollCards.length) {
        lastTickCardIndex = currentCardIdx;
        sfx.playCardTick();
      }

      if (progress < 1) {
        animFrame = requestAnimationFrame(animate);
      } else {
        setIsFinished(true);
        sfx.playWinnerChime();
        setTimeout(() => {
          onComplete?.();
        }, 750);
      }
    };

    animFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [drawData, durationSec, soundEnabled, soundVolume]);

  return (
    <div className="relative w-full max-w-5xl mx-auto my-6 px-2 select-none">
      {/* Top Telemetry Header */}
      <div className="flex items-center justify-between mb-2.5 px-3">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 led-beacon" />
          <span className="text-[11px] telemetry uppercase tracking-widest text-neutral-300 font-bold">
            {isFinished ? 'DRAW LOCKED // WINNER SELECTED' : 'DECELERATING // CS2 ROULETTE'}
          </span>
        </div>
        <div className="text-[10px] telemetry text-neutral-400 uppercase">
          POOL: {drawData.rollCards.length} ENTRANTS
        </div>
      </div>

      {/* Main Roulette Frame */}
      <div
        ref={containerRef}
        className="relative h-44 overflow-hidden rounded-xl border-2 border-[#1c2233] bg-[#090b12] shadow-2xl"
        style={{
          boxShadow: isFinished
            ? `0 0 40px -5px ${accentColor}90`
            : '0 20px 45px -10px rgba(0,0,0,0.9)',
        }}
      >
        {/* Shadow Vignettes */}
        <div className="absolute inset-0 pointer-events-none roulette-vignette z-20" />

        {/* Laser Sight Center Reticle */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 z-30 pointer-events-none flex flex-col justify-between items-center">
          {/* Top Reticle Pointer */}
          <div
            className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[14px] drop-shadow-md"
            style={{ borderTopColor: accentColor }}
          />

          {/* Laser Sight Vertical Line */}
          <div
            className="w-[2px] h-full animate-laser"
            style={{
              backgroundColor: accentColor,
              boxShadow: `0 0 8px ${accentColor}`,
            }}
          />

          {/* Bottom Reticle Pointer */}
          <div
            className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[14px] drop-shadow-md"
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
            const tierColor = isTargetWinner ? accentColor : tierColors[card.avatarSeed % tierColors.length];

            return (
              <div
                key={card.id}
                className="flex-shrink-0 flex flex-col items-center justify-between h-36 rounded-lg p-3 mx-1.5 transition-transform duration-300 relative overflow-hidden"
                style={{
                  width: `${CARD_WIDTH}px`,
                  backgroundColor: highlight ? '#161925' : '#0e111a',
                  border: highlight
                    ? `2.5px solid ${accentColor}`
                    : '1px solid #1c2233',
                  transform: highlight ? 'scale(1.04)' : 'scale(1)',
                  boxShadow: highlight ? `0 0 30px ${accentColor}80` : 'none',
                }}
              >
                {/* Top Card Tier Ribbon */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5 shadow-sm"
                  style={{ backgroundColor: tierColor }}
                />

                {/* Avatar Badge */}
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center font-black text-lg text-white shadow-inner border border-white/10 mt-1 telemetry"
                  style={{
                    background: isTargetWinner
                      ? `linear-gradient(135deg, ${accentColor}, #ffb703)`
                      : 'linear-gradient(135deg, #1c2132, #10131d)',
                  }}
                >
                  {card.username.charAt(0).toUpperCase()}
                </div>

                {/* Username & Metadata */}
                <div className="w-full text-center px-1">
                  <div className="text-xs font-bold truncate text-white telemetry">
                    @{card.username}
                  </div>
                  <div className="text-[9px] telemetry text-neutral-400 uppercase tracking-wider mt-0.5">
                    {isTargetWinner && isFinished ? 'CONFIRMED VICTOR' : `TICKET #${String(idx + 1).padStart(2, '0')}`}
                  </div>
                </div>

                {/* Bottom Tier Indicator */}
                <div
                  className="w-full h-1 rounded-full opacity-80"
                  style={{ backgroundColor: tierColor }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
