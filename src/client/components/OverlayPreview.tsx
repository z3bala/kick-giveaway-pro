import React, { useState } from 'react';
import {
  MonitorPlay,
  Volume2,
  VolumeX,
  Play,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Palette,
  Crosshair,
  Sliders,
} from 'lucide-react';
import type { OverlaySettings, DrawAnimationData } from '../../shared/types.js';
import { NameRoll } from '../overlay/NameRollRoll.js';
import { WinnerCard } from '../overlay/WinnerCard.js';
import { OverlayBadge } from '../overlay/OverlayBadge.js';

interface OverlayPreviewProps {
  settings: OverlaySettings;
  overlayToken?: string;
  onUpdateSettings: (newSettings: Partial<OverlaySettings>) => Promise<void>;
}

export const OverlayPreview: React.FC<OverlayPreviewProps> = ({
  settings,
  overlayToken,
  onUpdateSettings,
}) => {
  const [testMode, setTestMode] = useState<'badge' | 'roll' | 'winner'>('badge');
  const [testDrawData, setTestDrawData] = useState<DrawAnimationData | null>(null);
  const [copied, setCopied] = useState(false);

  const getOverlayUrl = () => {
    const origin = window.location.origin;
    const tokenParam = overlayToken ? `?token=${encodeURIComponent(overlayToken)}` : '';
    return `${origin}/overlay${tokenParam}`;
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(getOverlayUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const startTestRoll = () => {
    const sampleNames = [
      'GamerNinja', 'KickStreamer', 'Vortex99', 'PixelKnight', 'NovaBlade',
      'ShadowRider', 'ApexPredator', 'HyperSonic', 'LootMaster', 'VictoryRoyale',
      'CyberWolf', 'NeonDrifter', 'GhostSniper', 'TitanForge', 'QuantumEcho'
    ];

    const cards = [];
    const targetIdx = 48;
    for (let i = 0; i < 60; i++) {
      const name = sampleNames[i % sampleNames.length];
      cards.push({
        id: `test-card-${i}`,
        username: i === targetIdx ? 'WINNER_LootMaster' : name,
        isWinner: i === targetIdx,
        avatarSeed: i * 37,
      });
    }

    const testData: DrawAnimationData = {
      giveawayId: 'test-gw',
      winner: {
        id: 'test-winner-1',
        giveawayId: 'test-gw',
        kickUserId: 'test-user',
        username: 'WINNER_LootMaster',
        joinedAt: new Date().toISOString(),
        status: 'active',
      },
      rollCards: cards,
      targetIndex: targetIdx,
      durationSec: settings.animationDurationSec || 7.5,
      startedAt: Date.now(),
    };

    setTestDrawData(testData);
    setTestMode('roll');
  };

  const sampleGiveaway = {
    id: 'sample-gw',
    title: 'Championship Knife Giveaway',
    prize: 'M9 Bayonet | Fade (Factory New)',
    keyword: '!join',
    status: 'open' as const,
    winnerId: null,
    winnerUsername: null,
    participantCount: 42,
    createdAt: new Date().toISOString(),
    openedAt: new Date().toISOString(),
    closedAt: null,
    completedAt: null,
  };

  const sampleWinner = {
    id: 'sample-winner',
    giveawayId: 'sample-gw',
    kickUserId: 'kick-user-99',
    username: 'WINNER_LootMaster',
    joinedAt: new Date().toISOString(),
    status: 'active' as const,
  };

  const colorPresets = [
    { label: 'Covert Crimson', hex: '#e63946' },
    { label: 'Gold Fade', hex: '#ffb703' },
    { label: 'Kick Phosphor', hex: '#53fc18' },
    { label: 'Classified Violet', hex: '#8847ff' },
    { label: 'Deep Cyan', hex: '#06b6d4' },
    { label: 'Pure White', hex: '#ffffff' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1b1f2e]">
        <div>
          <h2 className="text-xl font-black text-white tracking-wider uppercase telemetry">
            Overlay Studio Monitor
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Calibrate, test, and preview your live OBS Studio Browser Source in real time.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={copyUrl}
            className="px-3 py-1.5 rounded-lg text-xs telemetry font-bold bg-[#141722] border border-[#23293c] text-neutral-200 hover:text-white transition-all flex items-center space-x-2"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">COPIED</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-neutral-400" />
                <span>COPY OVERLAY URL</span>
              </>
            )}
          </button>

          <a
            href={getOverlayUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg text-xs telemetry font-bold text-white shadow-sm flex items-center space-x-2 uppercase tracking-wider"
            style={{ backgroundColor: settings.accentColor }}
          >
            <span>LIVE OBS VIEW</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* 16:9 Broadcast Monitor */}
      <div className="p-4 rounded-xl tactical-surface space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MonitorPlay className="w-4 h-4 text-neutral-400" />
            <span className="text-xs telemetry uppercase text-neutral-300 font-bold tracking-wider">
              1080P BROADCAST CANVAS // SIMULATED STREAM
            </span>
          </div>

          <div className="flex items-center space-x-1.5 text-xs telemetry">
            <button
              onClick={() => setTestMode('badge')}
              className={`px-2.5 py-1 rounded font-bold transition-all ${
                testMode === 'badge' ? 'bg-[#181d2b] text-white border border-[#2b3349]' : 'text-neutral-400'
              }`}
            >
              STREAM BADGE
            </button>
            <button
              onClick={startTestRoll}
              className={`px-2.5 py-1 rounded font-bold transition-all flex items-center space-x-1 ${
                testMode === 'roll' ? 'bg-[#181d2b] text-white border border-[#2b3349]' : 'text-neutral-400'
              }`}
            >
              <Play className="w-3 h-3 fill-current" />
              <span>TEST CS2 ROLL</span>
            </button>
            <button
              onClick={() => setTestMode('winner')}
              className={`px-2.5 py-1 rounded font-bold transition-all ${
                testMode === 'winner' ? 'bg-[#181d2b] text-white border border-[#2b3349]' : 'text-neutral-400'
              }`}
            >
              VICTOR CARD
            </button>
          </div>
        </div>

        {/* Canvas Display with aspect ratio and monitor reticle */}
        <div className="relative w-full aspect-video rounded-lg border border-[#1b202e] bg-[#07090f] overflow-hidden flex items-center justify-center shadow-inner">
          <div className="absolute top-3 left-3 text-[9px] telemetry text-neutral-600 uppercase pointer-events-none">
            FEED: OVERLAY_CHANNEL_01 • 1920x1080 (SCALED)
          </div>

          <div
            className="w-full flex items-center justify-center p-4 transition-transform duration-200"
            style={{ transform: `scale(${settings.scale || 1})` }}
          >
            {testMode === 'roll' && testDrawData ? (
              <div className="w-full max-w-4xl">
                <NameRoll
                  drawData={testDrawData}
                  durationSec={settings.animationDurationSec}
                  soundEnabled={settings.soundEnabled}
                  soundVolume={settings.soundVolume}
                  accentColor={settings.accentColor}
                  onComplete={() => setTestMode('winner')}
                />
              </div>
            ) : testMode === 'winner' ? (
              <WinnerCard
                winner={sampleWinner}
                giveaway={sampleGiveaway}
                accentColor={settings.accentColor}
              />
            ) : (
              <OverlayBadge
                giveaway={sampleGiveaway}
                settings={settings}
                recentJoined={sampleWinner}
              />
            )}
          </div>
        </div>
      </div>

      {/* Calibration Deck & OBS Setup Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Styling Controls */}
        <div className="p-4 rounded-xl tactical-surface space-y-4">
          <div className="flex items-center space-x-2">
            <Palette className="w-4 h-4 text-neutral-400" />
            <h3 className="text-xs font-bold text-white uppercase telemetry tracking-wider">
              Overlay Visual Palette
            </h3>
          </div>

          {/* Accent Presets */}
          <div>
            <label className="block text-[10px] text-neutral-400 telemetry uppercase mb-2">
              Primary Theme Accent
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {colorPresets.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => onUpdateSettings({ accentColor: c.hex })}
                  className={`w-7 h-7 rounded-lg border-2 transition-transform ${
                    settings.accentColor.toLowerCase() === c.hex.toLowerCase()
                      ? 'scale-110 border-white shadow-md'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                />
              ))}
              <input
                type="color"
                value={settings.accentColor}
                onChange={(e) => onUpdateSettings({ accentColor: e.target.value })}
                className="w-7 h-7 rounded-lg bg-transparent border-0 cursor-pointer"
                title="Custom Hex"
              />
              <span className="text-xs telemetry text-neutral-300 ml-1">{settings.accentColor}</span>
            </div>
          </div>

          {/* Animation Duration Slider */}
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-1 telemetry">
              <span>ROLL DURATION</span>
              <span className="text-white font-bold">{settings.animationDurationSec}s</span>
            </div>
            <input
              type="range"
              min="4"
              max="15"
              step="0.5"
              value={settings.animationDurationSec}
              onChange={(e) => onUpdateSettings({ animationDurationSec: Number(e.target.value) })}
              className="w-full h-1 bg-[#1c2232] rounded appearance-none cursor-pointer accent-red-500"
            />
            <div className="flex justify-between text-[9px] text-neutral-400 telemetry mt-0.5">
              <span>FAST (4s)</span>
              <span>STANDARD (7.5s)</span>
              <span>CINEMATIC (15s)</span>
            </div>
          </div>

          {/* Scale Slider */}
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-1 telemetry">
              <span>SCALE FACTOR</span>
              <span className="text-white font-bold">{Math.round((settings.scale || 1) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.6"
              max="1.5"
              step="0.05"
              value={settings.scale || 1}
              onChange={(e) => onUpdateSettings({ scale: Number(e.target.value) })}
              className="w-full h-1 bg-[#1c2232] rounded appearance-none cursor-pointer accent-red-500"
            />
          </div>

          {/* Audio Controls */}
          <div className="pt-2 border-t border-[#1b202e] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-300 telemetry font-medium">
                MECHANICAL CLICK & FANFARE AUDIO
              </span>
              <button
                onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                className={`p-1.5 rounded-lg border transition-colors ${
                  settings.soundEnabled
                    ? 'bg-[#181d2a] text-white border-[#273045]'
                    : 'bg-[#12151e] text-neutral-500 border-[#1c212e]'
                }`}
              >
                {settings.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
            </div>

            {settings.soundEnabled && (
              <div>
                <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1 telemetry">
                  <span>SYNTH LEVEL</span>
                  <span className="text-white">{Math.round((settings.soundVolume || 0.8) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={settings.soundVolume || 0.8}
                  onChange={(e) => onUpdateSettings({ soundVolume: Number(e.target.value) })}
                  className="w-full h-1 bg-[#1c2232] rounded appearance-none cursor-pointer accent-red-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right: OBS Configuration Guide */}
        <div className="p-4 rounded-xl tactical-surface space-y-3 text-xs telemetry">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-neutral-400" />
            <h3 className="text-xs font-bold text-white uppercase telemetry tracking-wider">
              OBS Source Parameters
            </h3>
          </div>

          <div className="space-y-2.5 leading-relaxed text-neutral-300">
            <div className="p-2.5 rounded-lg bg-[#11141e] border border-[#1e2436]">
              <div className="font-bold text-white mb-0.5">SOURCE TYPE: BROWSER</div>
              <p className="text-[11px] text-neutral-400 font-sans">
                In OBS Studio, click <strong className="text-white">+</strong> under Sources and select <strong className="text-white">Browser</strong>.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-[#11141e] border border-[#1e2436]">
              <div className="font-bold text-white mb-1">CANVAS RESOLUTION:</div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-[#171b28] p-1.5 rounded border border-[#232a3c]">
                  WIDTH: <strong className="text-white">1920</strong>
                </div>
                <div className="bg-[#171b28] p-1.5 rounded border border-[#232a3c]">
                  HEIGHT: <strong className="text-white">1080</strong>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#11141e] border border-[#1e2436]">
              <div className="font-bold text-white mb-0.5">AUDIO CONTROL:</div>
              <p className="text-[11px] text-neutral-400 font-sans">
                Check <strong className="text-white">"Control audio via OBS"</strong> in source properties to route the case-opening sound directly to your OBS mixer faders.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
