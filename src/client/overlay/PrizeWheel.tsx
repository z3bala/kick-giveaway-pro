import React, { useEffect, useRef, useState } from 'react';
import { sfx } from './soundEffects.js';

interface PrizeWheelProps {
  segments: string[];
  targetPrize?: string;
  targetIndex?: number;
  durationSec?: number;
  soundEnabled?: boolean;
  soundVolume?: number;
  accentColor?: string;
  onPrizeLocked?: (prize: string) => void;
}

export const PrizeWheel: React.FC<PrizeWheelProps> = ({
  segments = ['1$', '2$', '3$', '5$', '10$'],
  targetPrize,
  targetIndex,
  durationSec = 4.2,
  soundEnabled = true,
  soundVolume = 0.8,
  accentColor = '#53fc18',
  onPrizeLocked,
}) => {
  const [rotation, setRotation] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockedPrize, setLockedPrize] = useState<string>('');
  const [needleTilt, setNeedleTilt] = useState(0);
  const hasTriggeredComplete = useRef(false);

  const cleanSegments = segments && segments.length > 0 ? segments : ['1$', '2$', '3$', '5$'];
  const numSegments = cleanSegments.length;
  const sliceAngle = 360 / numSegments;

  // Determine winning index
  const resolvedTargetIndex =
    typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex < numSegments
      ? targetIndex
      : targetPrize
      ? Math.max(0, cleanSegments.indexOf(targetPrize))
      : 0;

  const resolvedPrize = cleanSegments[resolvedTargetIndex] || cleanSegments[0];

  useEffect(() => {
    sfx.setConfig(soundEnabled, soundVolume);

    // Target slice center angle: (resolvedTargetIndex + 0.5) * sliceAngle
    // Pointer is at 12 o'clock (0 degrees).
    // Clockwise rotation theta brings slice at alpha to the top when:
    // (finalAngle + alpha) % 360 = 0  =>  finalAngle = (spins * 360) - alpha
    const targetSliceCenter = (resolvedTargetIndex + 0.5) * sliceAngle;
    const fullSpins = 5 + Math.floor(Math.random() * 2); // 5 to 6 full dramatic spins
    const organicJitter = (Math.random() * 0.4 - 0.2) * sliceAngle; // Natural landing jitter
    const totalRotation = fullSpins * 360 - targetSliceCenter + organicJitter;

    const startTime = performance.now();
    const durationMs = (durationSec || 4.2) * 1000;
    let animFrame: number;
    let lastSliceIdx = -1;

    // Smooth casino quintic ease-out deceleration
    const easeOutQuint = (t: number): number => {
      return 1 - Math.pow(1 - t, 4.8);
    };

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, Math.max(0, elapsed / durationMs));
      const eased = easeOutQuint(progress);
      const currentDeg = eased * totalRotation;

      setRotation(currentDeg);

      // Check current segment passing under needle
      const normalizedAngle = ((-currentDeg % 360) + 360) % 360;
      const currentSegmentIdx = Math.floor(normalizedAngle / sliceAngle);

      if (currentSegmentIdx !== lastSliceIdx) {
        lastSliceIdx = currentSegmentIdx;
        sfx.playWheelTick();
        // Needle flapper bounce
        setNeedleTilt(progress < 0.85 ? (Math.random() > 0.5 ? 8 : -8) : 3);
        setTimeout(() => setNeedleTilt(0), 40);
      }

      if (progress < 1) {
        animFrame = requestAnimationFrame(animate);
      } else {
        setRotation(totalRotation);
        setIsLocked(true);
        setLockedPrize(resolvedPrize);
        setNeedleTilt(0);
        sfx.playPrizeLock();

        if (!hasTriggeredComplete.current) {
          hasTriggeredComplete.current = true;
          // Hold prize reveal for 1 second before kicking off name roll
          setTimeout(() => {
            onPrizeLocked?.(resolvedPrize);
          }, 1100);
        }
      }
    };

    animFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [resolvedTargetIndex, sliceAngle, durationSec, soundEnabled, soundVolume, resolvedPrize]);

  // SVG Geometry constants
  const size = 380;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 14;

  // Generate pie wedge SVG path
  const getSlicePath = (index: number) => {
    const startAngle = (index * sliceAngle - 90) * (Math.PI / 180);
    const endAngle = ((index + 1) * sliceAngle - 90) * (Math.PI / 180);

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);

    const largeArc = sliceAngle > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  // Text positioning along radius
  const getTextProps = (index: number) => {
    const midAngleDeg = (index + 0.5) * sliceAngle;
    const midAngleRad = (midAngleDeg - 90) * (Math.PI / 180);
    const textRadius = radius * 0.68;

    const tx = cx + textRadius * Math.cos(midAngleRad);
    const ty = cy + textRadius * Math.sin(midAngleRad);
    const textRotation = midAngleDeg;

    return { tx, ty, textRotation };
  };

  return (
    <div className="relative mx-auto flex flex-col items-center select-none filter drop-shadow-2xl">
      {/* Upper Status Tag */}
      <div className="mb-1 flex items-center space-x-2 px-3 py-1 rounded-full bg-[#080b12]/90 border border-white/[0.08] backdrop-blur-md">
        <span
          className={`w-2 h-2 rounded-full ${isLocked ? 'bg-[#53fc18]' : 'bg-amber-400 animate-ping'}`}
        />
        <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-neutral-300">
          {isLocked ? (
            <span className="text-white font-sans">
              PRIZE LOCKED:{' '}
              <strong className="text-sm font-black" style={{ color: accentColor }}>
                {lockedPrize}
              </strong>
            </span>
          ) : (
            'STEP 1: SPINNING PRIZE AMOUNT'
          )}
        </span>
      </div>

      {/* Semicircle Wheel Dome Container */}
      <div
        className="relative overflow-hidden flex items-start justify-center"
        style={{
          width: `${size}px`,
          height: `${size / 2 + 10}px`,
        }}
      >
        {/* Outer Glowing Arch Rim */}
        <div
          className="absolute inset-x-0 top-0 rounded-t-full border-t-2 border-x-2 pointer-events-none transition-all duration-300"
          style={{
            height: `${size / 2}px`,
            borderColor: isLocked ? accentColor : 'rgba(255, 255, 255, 0.15)',
            boxShadow: isLocked
              ? `0 -8px 30px -4px ${accentColor}70, inset 0 8px 25px -4px ${accentColor}40`
              : '0 -8px 25px -4px rgba(0,0,0,0.8), inset 0 4px 15px -2px rgba(255,255,255,0.06)',
          }}
        />

        {/* Rotating Wheel Disc SVG */}
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="will-change-transform"
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: `${cx}px ${cy}px`,
          }}
        >
          <defs>
            {/* Radial Dark Gradient for Backdrop */}
            <radialGradient id="wheelBgGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0a0f1d" />
              <stop offset="90%" stopColor="#05070d" />
              <stop offset="100%" stopColor="#000000" />
            </radialGradient>

            {/* Glowing Accent Filter */}
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Wheel Background Disc */}
          <circle cx={cx} cy={cy} r={radius} fill="url(#wheelBgGrad)" />

          {/* Wedges */}
          {cleanSegments.map((segment, idx) => {
            const isWinner = isLocked && idx === resolvedTargetIndex;
            // Alternating slice colors
            const baseFill = idx % 2 === 0 ? '#0f1422' : '#141c2e';
            const { tx, ty, textRotation } = getTextProps(idx);

            return (
              <g key={`slice-${idx}`}>
                <path
                  d={getSlicePath(idx)}
                  fill={isWinner ? `${accentColor}30` : baseFill}
                  stroke={isWinner ? accentColor : 'rgba(255, 255, 255, 0.12)'}
                  strokeWidth={isWinner ? 2.5 : 1}
                  className="transition-colors duration-300"
                />

                {/* Amount Text */}
                <text
                  x={tx}
                  y={ty}
                  fill={isWinner ? accentColor : '#ffffff'}
                  fontSize={cleanSegments.length > 8 ? 13 : 16}
                  fontWeight="900"
                  fontFamily="Inter, sans-serif"
                  textAnchor="middle"
                  dominantBaseline="central"
                  transform={`rotate(${textRotation}, ${tx}, ${ty})`}
                  style={{
                    filter: isWinner
                      ? `drop-shadow(0 0 8px ${accentColor})`
                      : 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
                  }}
                >
                  {segment}
                </text>
              </g>
            );
          })}

          {/* Perimeter LED Tick Studs */}
          {cleanSegments.map((_, idx) => {
            const tickAngle = (idx * sliceAngle - 90) * (Math.PI / 180);
            const dotX = cx + (radius - 5) * Math.cos(tickAngle);
            const dotY = cy + (radius - 5) * Math.sin(tickAngle);
            return (
              <circle
                key={`stud-${idx}`}
                cx={dotX}
                cy={dotY}
                r="2"
                fill={isLocked ? accentColor : 'rgba(255,255,255,0.4)'}
              />
            );
          })}
        </svg>

        {/* Center Pivot Hub (Bottom Center of Semicircle) */}
        <div
          className="absolute z-20 pointer-events-none rounded-t-full border-t border-x flex items-center justify-center backdrop-blur-md"
          style={{
            bottom: '0px',
            width: '70px',
            height: '35px',
            backgroundColor: '#090d16',
            borderColor: isLocked ? accentColor : 'rgba(255, 255, 255, 0.2)',
            boxShadow: `0 0 16px rgba(0, 0, 0, 0.8), 0 0 12px ${isLocked ? accentColor : 'transparent'}`,
          }}
        >
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: accentColor,
              boxShadow: `0 0 8px ${accentColor}`,
            }}
          />
        </div>

        {/* Top Reticle Pointer Needle (12 o'clock) */}
        <div
          className="absolute top-0 z-30 pointer-events-none flex flex-col items-center transition-transform duration-75"
          style={{
            transform: `rotate(${needleTilt}deg)`,
            transformOrigin: 'top center',
          }}
        >
          <div
            className="w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[18px] filter drop-shadow-md"
            style={{
              borderTopColor: accentColor,
              filter: `drop-shadow(0 0 8px ${accentColor})`,
            }}
          />
        </div>
      </div>
    </div>
  );
};
