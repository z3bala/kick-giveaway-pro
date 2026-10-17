import React, { useState } from 'react';
import {
  MonitorPlay,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Sliders,
  Palette,
  ExternalLink,
  Copy,
  Check,
  HelpCircle,
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
        avatarSeed: i * 42,
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
    title: '5,000 Follower Special',
    prize: '$50 Steam Gift Card',
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
    { label: 'Esports Crimson', hex: '#e11d48' },
    { label: 'Warm Amber', hex: '#f59e0b' },
    { label: 'Kick Green', hex: '#53fc18' },
    { label: 'Electric Purple', hex: '#8b5cf6' },
    { label: 'Cyan Blue', hex: '#06b6d4' },
    { label: 'Pure White', hex: '#ffffff' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Overlay Studio</h2>
          <p className="text-sm text-neutral-400">
            Real-time preview and customization of your OBS Studio Browser Source.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={copyUrl}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand-surface2 border border-brand-border text-neutral-200 hover:text-white transition-all flex items-center space-x-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copied OBS URL</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-neutral-400" />
                <span>Copy Overlay URL</span>
              </>
            )}
          </button>

          <a
            href={getOverlayUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white shadow-md flex items-center space-x-2"
            style={{ backgroundColor: settings.accentColor }}
          >
            <span>Open in OBS View</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Main Preview Box (16:9 simulated stream canvas) */}
      <div className="p-6 rounded-2xl bg-brand-surface border border-brand-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MonitorPlay className="w-4 h-4 text-neutral-400" />
            <span className="text-xs font-mono uppercase text-neutral-300 font-bold">
              OBS 1080p Canvas Preview (Simulated Stream)
            </span>
          </div>

          {/* Test state switches */}
          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={() => setTestMode('badge')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                testMode === 'badge' ? 'bg-brand-surface3 text-white border border-brand-border' : 'text-neutral-400'
              }`}
            >
              Stream Badge
            </button>
            <button
              onClick={startTestRoll}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
                testMode === 'roll' ? 'bg-brand-surface3 text-white border border-brand-border' : 'text-neutral-400'
              }`}
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Test Roll</span>
            </button>
            <button
              onClick={() => setTestMode('winner')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                testMode === 'winner' ? 'bg-brand-surface3 text-white border border-brand-border' : 'text-neutral-400'
              }`}
            >
              Winner Card
            </button>
          </div>
        </div>

        {/* The Canvas container with dark stream backdrop grid */}
        <div className="relative w-full aspect-video rounded-xl border border-neutral-800 bg-[#0d0f17] overflow-hidden flex items-center justify-center shadow-inner">
          {/* Subtle stream mock watermark */}
          <div className="absolute top-4 left-4 text-[10px] font-mono text-neutral-600 uppercase pointer-events-none">
            OBS Studio Preview • 1920x1080 (Scaled)
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

      {/* Settings Customizer & OBS Setup Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Visual Customizer */}
        <div className="p-6 rounded-2xl bg-brand-surface border border-brand-border space-y-5">
          <div className="flex items-center space-x-2">
            <Palette className="w-4 h-4 text-neutral-400" />
            <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
              Overlay Styling Controls
            </h3>
          </div>

          {/* Accent Color Palette */}
          <div>
            <label className="block text-xs text-neutral-400 font-mono uppercase mb-2">
              Primary Accent Color
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {colorPresets.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => onUpdateSettings({ accentColor: c.hex })}
                  className={`w-8 h-8 rounded-xl border-2 transition-transform ${
                    settings.accentColor.toLowerCase() === c.hex.toLowerCase()
                      ? 'scale-110 border-white shadow-lg'
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
                className="w-8 h-8 rounded-xl bg-transparent border-0 cursor-pointer"
                title="Custom Color"
              />
              <span className="text-xs font-mono text-neutral-300 ml-2">{settings.accentColor}</span>
            </div>
          </div>

          {/* Animation Duration Slider */}
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5 font-mono">
              <span>ROLL ANIMATION DURATION</span>
              <span className="text-white font-bold">{settings.animationDurationSec}s</span>
            </div>
            <input
              type="range"
              min="4"
              max="15"
              step="0.5"
              value={settings.animationDurationSec}
              onChange={(e) => onUpdateSettings({ animationDurationSec: Number(e.target.value) })}
              className="w-full h-1.5 bg-brand-surface3 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 font-mono mt-1">
              <span>Fast (4s)</span>
              <span>Standard (7.5s)</span>
              <span>Cinematic (15s)</span>
            </div>
          </div>

          {/* Scale Slider */}
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5 font-mono">
              <span>OVERLAY SCALE (ZOOM)</span>
              <span className="text-white font-bold">{Math.round((settings.scale || 1) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.6"
              max="1.5"
              step="0.05"
              value={settings.scale || 1}
              onChange={(e) => onUpdateSettings({ scale: Number(e.target.value) })}
              className="w-full h-1.5 bg-brand-surface3 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>

          {/* Sound Toggle & Volume */}
          <div className="pt-2 border-t border-brand-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-300 font-medium">Sound Effects (Clicks & Winner Chime)</span>
              <button
                onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                className={`p-2 rounded-xl border transition-colors ${
                  settings.soundEnabled
                    ? 'bg-brand-surface3 text-white border-brand-border'
                    : 'bg-brand-surface2 text-neutral-500 border-brand-border'
                }`}
              >
                {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>

            {settings.soundEnabled && (
              <div>
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-1 font-mono">
                  <span>SOUND VOLUME</span>
                  <span className="text-white">{Math.round((settings.soundVolume || 0.8) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={settings.soundVolume || 0.8}
                  onChange={(e) => onUpdateSettings({ soundVolume: Number(e.target.value) })}
                  className="w-full h-1.5 bg-brand-surface3 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
              </div>
            )}
          </div>

          {/* Element Display Toggles */}
          <div className="pt-2 border-t border-brand-border space-y-2 text-xs">
            <label className="flex items-center justify-between text-neutral-300 cursor-pointer">
              <span>Show Giveaway Title & Prize</span>
              <input
                type="checkbox"
                checked={settings.showTitle}
                onChange={(e) => onUpdateSettings({ showTitle: e.target.checked })}
                className="w-4 h-4 rounded bg-brand-surface3 border-brand-border text-red-600 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between text-neutral-300 cursor-pointer">
              <span>Show Live Entrant Count</span>
              <input
                type="checkbox"
                checked={settings.showCount}
                onChange={(e) => onUpdateSettings({ showCount: e.target.checked })}
                className="w-4 h-4 rounded bg-brand-surface3 border-brand-border text-red-600 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between text-neutral-300 cursor-pointer">
              <span>Show Recent Entrant Notification Pill</span>
              <input
                type="checkbox"
                checked={settings.showRecentTicker}
                onChange={(e) => onUpdateSettings({ showRecentTicker: e.target.checked })}
                className="w-4 h-4 rounded bg-brand-surface3 border-brand-border text-red-600 focus:ring-0"
              />
            </label>
          </div>
        </div>

        {/* Right Column: OBS Setup Instructions */}
        <div className="p-6 rounded-2xl bg-brand-surface border border-brand-border space-y-4">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-neutral-400" />
            <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
              OBS Studio Setup Guide
            </h3>
          </div>

          <div className="space-y-3 text-xs text-neutral-300 leading-relaxed">
            <div className="p-3 rounded-xl bg-brand-surface2 border border-brand-border">
              <div className="font-bold text-white mb-1">1. Add Browser Source</div>
              <p>In OBS Studio, click <strong className="text-white">+</strong> under Sources and select <strong className="text-white">Browser</strong>.</p>
            </div>

            <div className="p-3 rounded-xl bg-brand-surface2 border border-brand-border">
              <div className="font-bold text-white mb-1">2. Enter URL & Dimensions</div>
              <div className="font-mono text-[11px] text-neutral-400 mb-1 truncate">
                URL: <span className="text-neutral-200 select-all">{getOverlayUrl()}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-[11px]">
                <div className="bg-brand-surface3 p-2 rounded border border-brand-border">
                  Width: <strong className="text-white">1920</strong>
                </div>
                <div className="bg-brand-surface3 p-2 rounded border border-brand-border">
                  Height: <strong className="text-white">1080</strong>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-brand-surface2 border border-brand-border">
              <div className="font-bold text-white mb-1">3. Check Transparency & Refresh</div>
              <p>
                The background is 100% transparent by default. Check <strong className="text-white">"Refresh browser when scene becomes active"</strong> and <strong className="text-white">"Control audio via OBS"</strong> if you wish to adjust volume inside OBS mixer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
