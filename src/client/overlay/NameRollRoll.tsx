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
  accentColor = '#53fc18',
  onComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [isFinished, setIsFinished] = useState(false);

  const CARD_WIDTH = 150;
  const CARD_GAP = 12;
  const STRIDE = CARD_WIDTH + CARD_GAP;

  useEffect(() => {
    sfx.setConfig(soundEnabled, soundVolume);

    const container = containerRef.current;
    const strip = stripRef.current;
    if (!container || !strip) return;

    const viewportWidth = container.clientWidth || 900;
    const targetIdx = drawData.targetIndex;

    const cardCenter = targetIdx * STRIDE + CARD_WIDTH / 2;
    // Micro organic offset so it lands naturally in the center zone
    const organicOffset = (drawData.startedAt % 24) - 12;
    const finalDistance = cardCenter - viewportWidth / 2 + organicOffset;

    let animFrame: number;
    const startTime = performance.now();
    const durationMs = (durationSec || drawData.durationSec || 7.5) * 1000;

    let lastTickCardIndex = -1;

    // Smooth case-opening deceleration
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

      // Check card passing center needle for click sound
      const currentCenterPos = currentX + viewportWidth / 2;
      const currentCardIdx = Math.floor(currentCenterPos / STRIDE);
      if (
        currentCardIdx !== lastTickCardIndex &&
        currentCardIdx >= 0 &&
        currentCardIdx < drawData.rollCards.length
      ) {
        lastTickCardIndex = currentCardIdx;
        sfx.playCardTick();
      }

      if (progress < 1) {
        animFrame = requestAnimationFrame(animate);
      } else {
        setIsFinished(true);
        sfx.playWinnerChime();
        // Pause 1 second on winner before opening the victory card
        setTimeout(() => {
          onComplete?.();
        }, 1100);
      }
    };

    animFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [drawData, durationSec, soundEnabled, soundVolume]);

  return (
    <div className="relative w-full max-w-4xl mx-auto my-3 select-none filter drop-shadow-2xl">
      {/* Clean Streamer Header */}
      <div className="flex items-center justify-between mb-2 px-3 py-1.5 rounded-xl bg-[#0a0d16]/90 border border-white/[0.08] backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <span
            className={`w-2 h-2 rounded-full ${isFinished ? 'bg-[#53fc18]' : 'bg-[#53fc18] animate-ping'}`}
            style={{ boxShadow: `0 0 8px #53fc18` }}
          />
          <span className="text-xs font-bold tracking-wide text-white uppercase font-sans">
            {isFinished ? 'WINNER SELECTED' : 'DRAW IN PROGRESS'}
          </span>
        </div>

        <div className="text-[11px] font-mono text-neutral-400">
          ENTRANTS: <span className="font-bold text-white">{drawData.rollCards.length}</span>
        </div>
      </div>

      {/* Main Roll Container */}
      <div
        ref={containerRef}
        className="relative h-36 overflow-hidden rounded-2xl border bg-[#080b12] shadow-2xl transition-all duration-300"
        style={{
          borderColor: isFinished ? accentColor : 'rgba(255, 255, 255, 0.12)',
          boxShadow: isFinished
            ? `0 0 35px -5px ${accentColor}60, 0 20px 40px -10px rgba(0,0,0,0.9)`
            : '0 20px 45px -10px rgba(0,0,0,0.95)',
        }}
      >
        {/* Soft Left & Right Vignette Shadows */}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#080b12] to-transparent z-20 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#080b12] to-transparent z-20 pointer-events-none" />

        {/* Clean Center Needle */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-4 z-30 pointer-events-none flex flex-col justify-between items-center">
          {/* Top Indicator Arrow */}
          <div
            className="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[12px] filter drop-shadow-md"
            style={{
              borderTopColor: accentColor,
              filter: `drop-shadow(0 0 6px ${accentColor})`,
            }}
          />

          {/* Vertical Needle Line */}
          <div
            className="w-[1.5px] h-full"
            style={{
              backgroundColor: accentColor,
              boxShadow: `0 0 8px ${accentColor}`,
            }}
          />

          {/* Bottom Indicator Arrow */}
          <div
            className="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[12px] filter drop-shadow-md"
            style={{
              borderBottomColor: accentColor,
              filter: `drop-shadow(0 0 6px ${accentColor})`,
            }}
          />
        </div>

        {/* Rolling Tape Strip */}
        <div
          ref={stripRef}
          className="flex items-center h-full will-change-transform py-3 px-6"
          style={{ transform: 'translate3d(0, 0, 0)' }}
        >
          {drawData.rollCards.map((card, idx) => {
            const isTargetWinner = idx === drawData.targetIndex;
            // Highlight ONLY when roll physically stops
            const highlight = isFinished && isTargetWinner;

            return (
              <div
                key={card.id}
                className="flex-shrink-0 flex flex-col items-center justify-center h-28 rounded-xl mx-1.5 transition-all duration-300 relative select-none"
                style={{
                  width: `${CARD_WIDTH}px`,
                  backgroundColor: highlight ? '#121826' : '#0d111a',
                  border: highlight
                    ? `2px solid ${accentColor}`
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  transform: highlight ? 'scale(1.04)' : 'scale(1)',
                  boxShadow: highlight
                    ? `0 0 24px -2px ${accentColor}70`
                    : 'none',
                }}
              >
                {/* Avatar Initial Box */}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm text-white mb-1.5 transition-all"
                  style={{
                    backgroundColor: highlight ? `${accentColor}25` : 'rgba(255, 255, 255, 0.06)',
                    border: `1px solid ${highlight ? accentColor : 'rgba(255, 255, 255, 0.12)'}`,
                    color: highlight ? accentColor : '#ffffff',
                  }}
                >
                  {card.username.charAt(0).toUpperCase()}
                </div>

                {/* Username */}
                <div
                  className="text-xs font-bold truncate max-w-[124px] text-center px-1"
                  style={{ color: highlight ? accentColor : '#ffffff' }}
                >
                  @{card.username}
                </div>

                {/* Subtitle / Ticket */}
                <div
                  className="text-[10px] font-mono mt-0.5"
                  style={{ color: highlight ? accentColor : '#94a3b8' }}
                >
                  {highlight ? 'WINNER' : `Ticket #${String(idx + 1).padStart(2, '0')}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
