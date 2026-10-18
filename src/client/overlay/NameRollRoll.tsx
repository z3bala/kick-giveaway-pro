import React, { useEffect, useRef, useState } from 'react';
import type { DrawAnimationData } from '../../shared/types.js';
import { sfx } from './soundEffects.js';
import { PrizeWheel } from './PrizeWheel.js';

interface NameRollProps {
  drawData: DrawAnimationData;
  durationSec?: number;
  soundEnabled?: boolean;
  soundVolume?: number;
  accentColor?: string;
  onPrizeLocked?: (prize: string) => void;
  onComplete?: () => void;
}

export const NameRoll: React.FC<NameRollProps> = ({
  drawData,
  durationSec = 7.5,
  soundEnabled = true,
  soundVolume = 0.8,
  accentColor = '#53fc18',
  onPrizeLocked,
  onComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const isWheelMode = Boolean(
    drawData.wheelEnabled && drawData.wheelSegments && drawData.wheelSegments.length > 0
  );

  const [stage, setStage] = useState<'wheel' | 'names' | 'finished'>(
    isWheelMode ? 'wheel' : 'names'
  );
  const [resolvedPrize, setResolvedPrize] = useState<string>(drawData.rolledPrize || '');

  const CARD_WIDTH = 150;
  const CARD_GAP = 12;
  const STRIDE = CARD_WIDTH + CARD_GAP;

  // Run the horizontal name roll ONLY once wheel phase finishes (or immediately if wheel disabled)
  useEffect(() => {
    sfx.setConfig(soundEnabled, soundVolume);

    if (stage !== 'names') return;

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
        setStage('finished');
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
  }, [stage, drawData, durationSec, soundEnabled, soundVolume, onComplete]);

  const handlePrizeLocked = (prize: string) => {
    setResolvedPrize(prize);
    onPrizeLocked?.(prize);
    setStage('names');
  };

  const isFinished = stage === 'finished';

  return (
    <div className="relative w-full max-w-4xl mx-auto my-2 select-none filter drop-shadow-2xl flex flex-col items-center">
      {/* Half-Wheel on Top (if wheel mode is active) */}
      {isWheelMode && (
        <div className="z-10 -mb-2 transition-all duration-300">
          <PrizeWheel
            segments={drawData.wheelSegments!}
            targetPrize={drawData.rolledPrize}
            targetIndex={drawData.wheelTargetIndex}
            durationSec={drawData.wheelDurationSec || 4.2}
            soundEnabled={soundEnabled}
            soundVolume={soundVolume}
            accentColor={accentColor}
            onPrizeLocked={handlePrizeLocked}
          />
        </div>
      )}

      {/* Main Roll Section */}
      <div className="w-full relative z-20">
        {/* Streamer Progress Bar Header */}
        <div className="flex items-center justify-between mb-2 px-3.5 py-1.5 rounded-xl bg-[#0a0d16]/90 border border-white/[0.08] backdrop-blur-md">
          <div className="flex items-center space-x-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isFinished
                  ? 'bg-[#53fc18]'
                  : stage === 'wheel'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-[#53fc18] animate-ping'
              }`}
              style={{ boxShadow: isFinished ? `0 0 8px #53fc18` : undefined }}
            />
            <span className="text-xs font-bold tracking-wide text-white uppercase font-sans">
              {stage === 'wheel' ? (
                <span className="text-amber-300">STAGE 1: ROLLING PRIZE AMOUNT...</span>
              ) : stage === 'names' ? (
                <span>
                  STAGE 2: ROLLING WINNER FOR{' '}
                  <strong style={{ color: accentColor }}>
                    {resolvedPrize || drawData.rolledPrize || 'PRIZE'}
                  </strong>
                </span>
              ) : (
                <span style={{ color: accentColor }}>
                  WINNER: @{drawData.winner.username}{' '}
                  {resolvedPrize ? `(${resolvedPrize})` : ''}
                </span>
              )}
            </span>
          </div>

          <div className="text-[11px] font-mono text-neutral-400 flex items-center space-x-2">
            {resolvedPrize && (
              <span
                className="px-2 py-0.5 rounded text-[10px] font-bold text-black"
                style={{ backgroundColor: accentColor }}
              >
                PRIZE: {resolvedPrize}
              </span>
            )}
            <span>
              ENTRANTS: <span className="font-bold text-white">{drawData.rollCards.length}</span>
            </span>
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

                {/* Username - Full Name */}
                <div
                  className="text-xs font-bold text-center px-1 break-words w-full leading-tight max-w-[145px]"
                  style={{
                    color: highlight ? accentColor : '#ffffff',
                    fontSize: card.username.length > 13 ? '10px' : '11px',
                  }}
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
  </div>
);
};
