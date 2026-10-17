import React, { useState } from 'react';
import {
  Tv,
  Volume2,
  VolumeX,
  Play,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Palette,
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
    title: 'Stream Community Giveaway',
    prize: '$100 Steam Gift Card',
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
    { label: 'Kick Neon Green', hex: '#53fc18' },
    { label: 'Covert Crimson', hex: '#e63946' },
    { label: 'Gold Amber', hex: '#f59e0b' },
    { label: 'Classified Violet', hex: '#8b5cf6' },
    { label: 'Electric Blue', hex: '#3b82f6' },
    { label: 'Pure White', hex: '#ffffff' },
  ];

  return (
    <div className="space-y-6 max-w-5xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">OBS Overlay Studio</h2>
          <p className="text-xs text-neutral-400 mt-1">
            Customize colors, test the CS-style unboxing roulette, and copy your OBS Browser Source link.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={copyUrl}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all border ${
              copied
                ? 'bg-[#53fc18] text-black border-[#53fc18]'
                : 'bg-white/[0.06] text-neutral-200 border-white/[0.08] hover:bg-white/[0.12] hover:text-white'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied Link!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Overlay URL</span>
              </>
            )}
          </button>

          <a
            href={getOverlayUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#53fc18] hover:bg-[#45d914] text-black transition-all shadow-sm flex items-center space-x-1.5"
          >
            <span>Open Overlay</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* 16:9 Canvas Monitor */}
      <div className="p-6 rounded-2xl glass-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Tv className="w-4 h-4 text-[#53fc18]" />
            <span className="text-xs font-semibold text-white">
              Live Preview (16:9 1080p Stream)
            </span>
          </div>

          <div className="flex items-center space-x-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.06] text-xs">
            <button
              onClick={() => setTestMode('badge')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                testMode === 'badge' ? 'bg-white/[0.1] text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Stream Badge
            </button>
            <button
              onClick={startTestRoll}
              className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
                testMode === 'roll' ? 'bg-[#53fc18] text-black font-semibold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Test CS2 Roll</span>
            </button>
            <button
              onClick={() => setTestMode('winner')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                testMode === 'winner' ? 'bg-white/[0.1] text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Winner Card
            </button>
          </div>
        </div>

        {/* Display Box */}
        <div className="relative w-full aspect-video rounded-xl border border-white/[0.08] bg-[#07090f] overflow-hidden flex items-center justify-center shadow-2xl">
          <div className="absolute top-3 left-3 text-[10px] font-mono text-neutral-600 uppercase pointer-events-none">
            OBS BROWSER SOURCE • 1920x1080
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

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visual Settings */}
        <div className="p-6 rounded-2xl glass-card space-y-5">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-white/[0.08]">
            <Palette className="w-4 h-4 text-[#53fc18]" />
            <h3 className="text-sm font-bold text-white">Appearance & Timing</h3>
          </div>

          {/* Accent Color Presets */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-2">
              Primary Accent Color
            </label>
            <div className="flex flex-wrap items-center gap-2.5">
              {colorPresets.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => onUpdateSettings({ accentColor: c.hex })}
                  className={`w-8 h-8 rounded-xl border-2 transition-all ${
                    settings.accentColor.toLowerCase() === c.hex.toLowerCase()
                      ? 'scale-110 border-white shadow-lg'
                      : 'border-transparent hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                />
              ))}
              <input
                type="color"
                value={settings.accentColor}
                onChange={(e) => onUpdateSettings({ accentColor: e.target.value })}
                className="w-8 h-8 rounded-xl bg-transparent border-0 cursor-pointer"
                title="Custom Hex"
              />
              <span className="text-xs font-mono text-neutral-300 ml-1">{settings.accentColor}</span>
            </div>
          </div>

          {/* Duration Slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-neutral-300 mb-2">
              <span>CS2 Roll Duration</span>
              <span className="text-[#53fc18] font-bold font-mono">{settings.animationDurationSec}s</span>
            </div>
            <input
              type="range"
              min="4"
              max="15"
              step="0.5"
              value={settings.animationDurationSec}
              onChange={(e) => onUpdateSettings({ animationDurationSec: Number(e.target.value) })}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#53fc18]"
            />
            <div className="flex justify-between text-[11px] text-neutral-500 mt-1">
              <span>Fast (4s)</span>
              <span>Standard (7.5s)</span>
              <span>Cinematic (15s)</span>
            </div>
          </div>

          {/* Scale Slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-neutral-300 mb-2">
              <span>Overlay Scale</span>
              <span className="text-white font-bold font-mono">{Math.round((settings.scale || 1) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.6"
              max="1.5"
              step="0.05"
              value={settings.scale || 1}
              onChange={(e) => onUpdateSettings({ scale: Number(e.target.value) })}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#53fc18]"
            />
          </div>

          {/* Sound Settings */}
          <div className="pt-3 border-t border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-white block">Mechanical Sound Effects</span>
                <span className="text-[11px] text-neutral-400">Audio clicks while spinning and victory chime</span>
              </div>
              <button
                onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                className={`p-2 rounded-xl border transition-all ${
                  settings.soundEnabled
                    ? 'bg-[#53fc18]/15 text-[#53fc18] border-[#53fc18]/30'
                    : 'bg-white/[0.04] text-neutral-500 border-white/[0.08]'
                }`}
              >
                {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>

            {settings.soundEnabled && (
              <div>
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
                  <span>Volume</span>
                  <span className="text-white font-mono">{Math.round((settings.soundVolume || 0.8) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={settings.soundVolume || 0.8}
                  onChange={(e) => onUpdateSettings({ soundVolume: Number(e.target.value) })}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#53fc18]"
                />
              </div>
            )}
          </div>
        </div>

        {/* OBS Setup Instructions */}
        <div className="p-6 rounded-2xl glass-card space-y-4">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-white/[0.08]">
            <Layers className="w-4 h-4 text-[#53fc18]" />
            <h3 className="text-sm font-bold text-white">How to Add to OBS Studio</h3>
          </div>

          <div className="space-y-3 text-xs leading-relaxed text-neutral-300">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
              <div className="font-semibold text-white">1. Create a Browser Source</div>
              <p className="text-neutral-400">
                In OBS Studio, click the <strong className="text-white">+</strong> button under <strong className="text-white">Sources</strong> and select <strong className="text-white">Browser</strong>.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
              <div className="font-semibold text-white">2. Paste URL & Set Dimensions</div>
              <p className="text-neutral-400">
                Paste your unique Overlay URL and set the exact dimensions:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-black/40 p-2 rounded-lg border border-white/[0.08]">
                  Width: <span className="text-[#53fc18] font-bold">1920</span>
                </div>
                <div className="bg-black/40 p-2 rounded-lg border border-white/[0.08]">
                  Height: <span className="text-[#53fc18] font-bold">1080</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
              <div className="font-semibold text-white">3. Enable Audio (Recommended)</div>
              <p className="text-neutral-400">
                Check <strong className="text-white">"Control audio via OBS"</strong> in the browser source properties to route roulette sound effects directly through your stream audio mixer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
