import React, { useEffect, useRef, useState } from 'react';
import { Target, Zap, ShieldCheck } from 'lucide-react';
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

// Authentic CS2 / Casino skin rarity tiers
interface TierStyle {
  name: string;
  color: string;
  bgGlow: string;
  border: string;
  badgeBg: string;
}

const TIERS: TierStyle[] = [
  {
    name: 'COVERT ★',
    color: '#eb4b4b',
    bgGlow: 'rgba(235, 75, 75, 0.18)',
    border: '#eb4b4b',
    badgeBg: 'rgba(235, 75, 75, 0.25)',
  },
  {
    name: 'CLASSIFIED',
    color: '#d32ce6',
    bgGlow: 'rgba(211, 44, 230, 0.16)',
    border: '#d32ce6',
    badgeBg: 'rgba(211, 44, 230, 0.25)',
  },
  {
    name: 'RESTRICTED',
    color: '#8847ff',
    bgGlow: 'rgba(136, 71, 255, 0.16)',
    border: '#8847ff',
    badgeBg: 'rgba(136, 71, 255, 0.25)',
  },
  {
    name: 'MIL-SPEC',
    color: '#4b69ff',
    bgGlow: 'rgba(75, 105, 255, 0.16)',
    border: '#4b69ff',
    badgeBg: 'rgba(75, 105, 255, 0.25)',
  },
  {
    name: 'KICK ELITE',
    color: '#53fc18',
    bgGlow: 'rgba(83, 252, 24, 0.16)',
    border: '#53fc18',
    badgeBg: 'rgba(83, 252, 24, 0.25)',
  },
];

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
  const [speedProgress, setSpeedProgress] = useState(100);

  const CARD_WIDTH = 186;
  const CARD_GAP = 12;
  const STRIDE = CARD_WIDTH + CARD_GAP;

  useEffect(() => {
    sfx.setConfig(soundEnabled, soundVolume);

    const container = containerRef.current;
    const strip = stripRef.current;
    if (!container || !strip) return;

    const viewportWidth = container.clientWidth || 1000;
    const targetIdx = drawData.targetIndex;

    const cardCenter = targetIdx * STRIDE + CARD_WIDTH / 2;
    // Micro organic offset so the card lands realistically within the center reticle zone
    const organicOffset = (drawData.startedAt % 28) - 14;
    const finalDistance = cardCenter - viewportWidth / 2 + organicOffset;

    let animFrame: number;
    const startTime = performance.now();
    const durationMs = (durationSec || drawData.durationSec || 7.5) * 1000;

    let lastTickCardIndex = -1;

    // Authentic CS case-opening deceleration curve (rapid glide entering slow crawl)
    const easeOutGlide = (t: number): number => {
      return 1 - Math.pow(1 - t, 4.3);
    };

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, Math.max(0, elapsed / durationMs));
      const eased = easeOutGlide(progress);
      const currentX = eased * finalDistance;

      // Live speed indicator (drops from 100% to 0%)
      const remainingSpeed = Math.round((1 - progress) * 100);
      setSpeedProgress(remainingSpeed);

      if (strip) {
        strip.style.transform = `translate3d(-${currentX}px, 0, 0)`;
      }

      // Check card passing center reticle for mechanical click
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
        setSpeedProgress(0);
        sfx.playWinnerChime();
        // Give viewers and streamer 1.2s to celebrate the winning card under the crosshair before transitioning
        setTimeout(() => {
          onComplete?.();
        }, 1200);
      }
    };

    animFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [drawData, durationSec, soundEnabled, soundVolume]);

  return (
    <div className="relative w-full max-w-5xl mx-auto my-4 select-none filter drop-shadow-2xl">
      {/* Upper Esports Telemetry HUD */}
      <div className="flex items-center justify-between mb-2.5 px-3 py-1.5 rounded-lg bg-[#0b0e17]/90 border border-white/[0.08] backdrop-blur-md">
        {/* Status Badge */}
        <div className="flex items-center space-x-2.5">
          <span
            className={`w-2.5 h-2.5 rounded-full ${isFinished ? 'bg-[#53fc18]' : 'bg-rose-500 animate-ping'}`}
            style={{ boxShadow: isFinished ? `0 0 10px #53fc18` : `0 0 10px #f43f5e` }}
          />
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-white font-mono">
              {isFinished ? 'WINNER CONFIRMED' : 'CS2 CASE DECELERATION'}
            </span>
            <span className="text-[10px] text-neutral-500 font-mono hidden sm:inline">
              | SHA-256 FAIR DRAW
            </span>
          </div>
        </div>

        {/* Speedometer Gauge & Entrant Counter */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 text-[10px] font-mono">
            <span className="text-neutral-400">RPM:</span>
            <div className="w-16 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-75"
                style={{
                  width: `${speedProgress}%`,
                  backgroundColor: isFinished ? '#53fc18' : accentColor,
                }}
              />
            </div>
            <span className="font-bold text-white w-7 text-right">{speedProgress}%</span>
          </div>

          <div className="text-[10px] font-mono text-neutral-400 flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#53fc18]" />
            <span className="hidden sm:inline">POOL:</span>
            <span className="font-bold text-white">{drawData.rollCards.length}</span>
          </div>
        </div>
      </div>

      {/* Main High-Tech Roulette Case Chassis */}
      <div
        ref={containerRef}
        className="relative h-48 overflow-hidden rounded-2xl border-2 bg-[#080b12] shadow-2xl transition-all duration-500"
        style={{
          borderColor: isFinished ? accentColor : '#1e2638',
          boxShadow: isFinished
            ? `0 0 50px -5px ${accentColor}80, 0 25px 60px -15px rgba(0,0,0,0.9)`
            : '0 25px 60px -15px rgba(0,0,0,0.95), inset 0 0 40px rgba(0,0,0,0.8)',
        }}
      >
        {/* Top & Bottom Carbon Trim Lines */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent z-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent z-20 pointer-events-none" />

        {/* Cinematic Edge Vignettes (Smooth fade on left & right entry) */}
        <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-[#080b12] via-[#080b12]/80 to-transparent z-20 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-[#080b12] via-[#080b12]/80 to-transparent z-20 pointer-events-none" />

        {/* Center Golden Laser Reticle & Pointers */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 z-30 pointer-events-none flex flex-col justify-between items-center">
          {/* Top Triangular Needle */}
          <div className="flex flex-col items-center">
            <div
              className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[16px] filter drop-shadow-md transition-all duration-300"
              style={{
                borderTopColor: isFinished ? '#ffffff' : accentColor,
                filter: isFinished
                  ? `drop-shadow(0 0 10px ${accentColor})`
                  : `drop-shadow(0 0 6px ${accentColor}80)`,
              }}
            />
          </div>

          {/* Central Alignment Crosshair Ring */}
          <div className="relative flex items-center justify-center">
            <div
              className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${
                isFinished ? 'scale-125 border-[#53fc18] animate-ping' : 'border-white/30'
              }`}
              style={{
                borderColor: isFinished ? '#53fc18' : `${accentColor}80`,
              }}
            />
            <div
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: isFinished ? '#ffffff' : accentColor }}
            />
          </div>

          {/* Bottom Triangular Needle */}
          <div className="flex flex-col items-center">
            <div
              className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[16px] filter drop-shadow-md transition-all duration-300"
              style={{
                borderBottomColor: isFinished ? '#ffffff' : accentColor,
                filter: isFinished
                  ? `drop-shadow(0 0 10px ${accentColor})`
                  : `drop-shadow(0 0 6px ${accentColor}80)`,
              }}
            />
          </div>

          {/* Vertical Glowing Laser Sight Beam */}
          <div
            className="absolute inset-y-0 w-[2px] pointer-events-none"
            style={{
              backgroundColor: isFinished ? '#ffffff' : accentColor,
              boxShadow: isFinished
                ? `0 0 12px #ffffff, 0 0 24px ${accentColor}`
                : `0 0 8px ${accentColor}`,
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
            // CRITICAL SPOILER FIX: Highlight ONLY when roll has physically settled and stopped!
            const highlight = isFinished && isTargetWinner;

            // CS2 Rarity Tier is purely randomized by card seed so the winner looks 100% like all other cards while rolling!
            const tier = TIERS[card.avatarSeed % TIERS.length];

            return (
              <div
                key={card.id}
                className="flex-shrink-0 flex flex-col justify-between h-40 rounded-xl mx-1.5 transition-all duration-300 relative overflow-hidden group select-none"
                style={{
                  width: `${CARD_WIDTH}px`,
                  backgroundColor: highlight ? '#131926' : '#0c0f18',
                  border: highlight
                    ? `2.5px solid ${accentColor}`
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  transform: highlight ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: highlight
                    ? `0 0 35px ${accentColor}90, inset 0 0 15px ${accentColor}30`
                    : 'none',
                }}
              >
                {/* Ambient Card Background Gradient */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-40 transition-opacity"
                  style={{
                    background: `linear-gradient(180deg, ${tier.bgGlow} 0%, transparent 65%)`,
                  }}
                />

                {/* Top Card Rarity Header */}
                <div
                  className="relative z-10 px-2.5 pt-2 pb-1 flex items-center justify-between border-b"
                  style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}
                >
                  <span
                    className="text-[9px] font-mono font-black tracking-wider uppercase px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: highlight ? `${accentColor}30` : tier.badgeBg,
                      color: highlight ? accentColor : tier.color,
                      border: `1px solid ${highlight ? accentColor : tier.color}40`,
                    }}
                  >
                    {highlight ? '★ VICTOR' : tier.name}
                  </span>

                  <span className="text-[9px] font-mono text-neutral-500">
                    #{String(idx + 1).padStart(2, '0')}
                  </span>
                </div>

                {/* Middle Card: Avatar + Username */}
                <div className="relative z-10 flex flex-col items-center justify-center py-1 px-2 text-center">
                  {/* Hexagon/Circle Tech Avatar */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-base text-white shadow-lg border relative overflow-hidden mb-1.5 transition-all duration-300"
                    style={{
                      borderColor: highlight ? accentColor : `${tier.color}60`,
                      background: highlight
                        ? `linear-gradient(135deg, ${accentColor}, #ffb703)`
                        : `linear-gradient(135deg, #191f2e, #0e121b)`,
                      boxShadow: highlight ? `0 0 18px ${accentColor}80` : 'none',
                    }}
                  >
                    <span className="font-mono tracking-wider">
                      {card.username.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Username Display */}
                  <div className="w-full">
                    <div
                      className="text-xs font-black truncate text-white tracking-tight"
                      style={{
                        color: highlight ? accentColor : '#ffffff',
                        textShadow: highlight ? `0 0 10px ${accentColor}` : 'none',
                      }}
                    >
                      @{card.username}
                    </div>
                    <div className="text-[9px] font-mono text-neutral-400 mt-0.5 uppercase tracking-wider">
                      {highlight ? 'OFFICIAL WINNER' : 'QUALIFIED ENTRY'}
                    </div>
                  </div>
                </div>

                {/* Bottom Rarity Accent Ribbon */}
                <div
                  className="relative z-10 w-full h-1.5 shadow-sm transition-all"
                  style={{
                    backgroundColor: highlight ? accentColor : tier.color,
                    boxShadow: highlight ? `0 0 10px ${accentColor}` : `0 0 6px ${tier.color}60`,
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
