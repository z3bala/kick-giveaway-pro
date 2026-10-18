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
  Layout,
  Maximize2,
  Sparkles,
  Eye,
  SlidersHorizontal,
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
  const [previewBg, setPreviewBg] = useState<'studio' | 'game' | 'grid'>('studio');

  const getOverlayUrl = () => {
    const origin = typeof window !== 'undefined' && !window.location.origin.includes('localhost')
      ? window.location.origin
      : 'https://kick-giveaway-pro.onrender.com';
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
        username: i === targetIdx ? 'LootMaster' : name,
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
        username: 'LootMaster',
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
    username: 'LootMaster',
    joinedAt: new Date().toISOString(),
    status: 'active' as const,
  };

  const colorPresets = [
    { label: 'Kick Neon Green (Default)', hex: '#53fc18' },
    { label: 'Electric Cyan', hex: '#00f0ff' },
    { label: 'Covert Crimson', hex: '#e63946' },
    { label: 'Gold Amber', hex: '#f59e0b' },
    { label: 'Classified Violet', hex: '#8b5cf6' },
    { label: 'Pure White', hex: '#ffffff' },
  ];

  const positions: Array<{ id: NonNullable<OverlaySettings['position']>; label: string; desc: string }> = [
    { id: 'top-left', label: 'Top Left', desc: 'Over webcam / chat' },
    { id: 'top-center', label: 'Top Center', desc: 'Broadcast header' },
    { id: 'top-right', label: 'Top Right', desc: 'Streamer classic' },
    { id: 'bottom-left', label: 'Bottom Left', desc: 'Above minimap' },
    { id: 'bottom-center', label: 'Bottom Center', desc: 'Lower third bar' },
    { id: 'bottom-right', label: 'Bottom Right', desc: 'Corner status' },
  ];

  const layoutStyles: Array<{ id: NonNullable<OverlaySettings['layoutStyle']>; label: string; desc: string }> = [
    { id: 'pill', label: 'Streamer Pill', desc: 'Clean floating capsule for webcam or stream corners.' },
    { id: 'bar', label: 'Broadcast Bar', desc: 'Horizontal bar for header or lower-third placement.' },
    { id: 'card', label: 'HUD Card', desc: 'Structured corner widget with prize and entrant details.' },
  ];

  // Helper for 16:9 preview positioning
  const getPreviewPosClass = (pos: string = 'top-right') => {
    switch (pos) {
      case 'top-left':
        return 'top-4 left-4 items-start justify-start';
      case 'top-center':
        return 'top-4 left-1/2 -translate-x-1/2 items-center justify-start';
      case 'top-right':
        return 'top-4 right-4 items-end justify-start';
      case 'bottom-left':
        return 'bottom-4 left-4 items-start justify-end';
      case 'bottom-center':
        return 'bottom-4 left-1/2 -translate-x-1/2 items-center justify-end';
      case 'bottom-right':
        return 'bottom-4 right-4 items-end justify-end';
      default:
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center';
    }
  };

  const previewPosClass = getPreviewPosClass(settings.position || 'top-right');
  const accent = settings.accentColor || '#53fc18';

  return (
    <div className="space-y-6 max-w-5xl pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-xl font-bold text-white tracking-tight">OBS Overlay Studio</h2>
            <span
              className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider"
              style={{ backgroundColor: `${accent}20`, color: accent, border: `1px solid ${accent}40` }}
            >
              1080P TRANSPARENT
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Arrange position for your streamer HUD, pick layout styles, and copy your browser source URL.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={copyUrl}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all border shadow-sm ${
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
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-black transition-all shadow-sm flex items-center space-x-1.5"
            style={{ backgroundColor: accent }}
          >
            <span>Open Overlay</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* 16:9 Canvas Monitor & State Switcher */}
      <div className="p-6 rounded-2xl glass-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Viewport Info & BG Toggle */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Tv className="w-4 h-4" style={{ color: accent }} />
              <span className="text-xs font-semibold text-white">
                Live 16:9 Stream Monitor
              </span>
            </div>

            <div className="flex items-center bg-black/40 p-0.5 rounded-lg border border-white/[0.06] text-[11px]">
              <button
                onClick={() => setPreviewBg('studio')}
                className={`px-2 py-0.5 rounded transition-all ${
                  previewBg === 'studio' ? 'bg-white/[0.12] text-white font-medium' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Studio Slate
              </button>
              <button
                onClick={() => setPreviewBg('game')}
                className={`px-2 py-0.5 rounded transition-all ${
                  previewBg === 'game' ? 'bg-white/[0.12] text-white font-medium' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Simulated Game HUD
              </button>
              <button
                onClick={() => setPreviewBg('grid')}
                className={`px-2 py-0.5 rounded transition-all ${
                  previewBg === 'grid' ? 'bg-white/[0.12] text-white font-medium' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Alpha Transparent
              </button>
            </div>
          </div>

          {/* Right: State Preview Switcher */}
          <div className="flex items-center space-x-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.06] text-xs">
            <button
              onClick={() => setTestMode('badge')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                testMode === 'badge' ? 'bg-white/[0.12] text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Live Badge ({settings.position || 'top-right'})
            </button>
            <button
              onClick={startTestRoll}
              className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
                testMode === 'roll' ? 'text-black font-semibold shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
              style={{ backgroundColor: testMode === 'roll' ? accent : 'transparent' }}
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Test CS2 Roll</span>
            </button>
            <button
              onClick={() => setTestMode('winner')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                testMode === 'winner' ? 'bg-white/[0.12] text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Winner Celebration
            </button>
          </div>
        </div>

        {/* 16:9 Display Frame */}
        <div
          className="relative w-full aspect-video rounded-xl border border-white/[0.08] overflow-hidden shadow-2xl select-none"
          style={{
            backgroundColor: previewBg === 'studio' ? '#07090f' : undefined,
            backgroundImage:
              previewBg === 'grid'
                ? 'linear-gradient(45deg, #121622 25%, transparent 25%), linear-gradient(-45deg, #121622 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #121622 75%), linear-gradient(-45deg, transparent 75%, #121622 75%)'
                : previewBg === 'game'
                ? 'radial-gradient(ellipse at center, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.95) 100%), linear-gradient(135deg, #090d16 0%, #161e31 100%)'
                : undefined,
            backgroundSize: previewBg === 'grid' ? '20px 20px' : undefined,
            backgroundPosition: previewBg === 'grid' ? '0 0, 0 10px, 10px -10px, -10px 0px' : undefined,
          }}
        >
          {/* Simulated Game HUD elements if game mode is toggled */}
          {previewBg === 'game' && (
            <div className="absolute inset-0 pointer-events-none opacity-20 flex flex-col justify-between p-4 font-mono text-[10px] text-neutral-400">
              <div className="flex justify-between items-center">
                <div className="w-16 h-16 rounded-full border border-white/30 flex items-center justify-center">
                  MINIMAP
                </div>
                <div className="text-right">
                  ROUND 14/30 • 1:42
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div className="bg-white/10 px-3 py-1 rounded">
                  +100 HP | 100 AP
                </div>
                <div className="bg-white/10 px-3 py-1 rounded">
                  AK-47 | 30/90
                </div>
              </div>
            </div>
          )}

          {/* Canvas Metadata Overlay */}
          <div className="absolute top-2.5 left-3 text-[9px] font-mono text-neutral-500 uppercase pointer-events-none flex items-center space-x-2">
            <span>OBS BROWSER SOURCE 1920x1080</span>
            <span>•</span>
            <span style={{ color: accent }}>POSITION: {settings.position || 'top-right'}</span>
            <span>•</span>
            <span>STYLE: {settings.layoutStyle || 'pill'}</span>
          </div>

          {/* Active Content Rendering */}
          {testMode === 'roll' && testDrawData ? (
            <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
              <div className="w-full max-w-3xl">
                <NameRoll
                  drawData={testDrawData}
                  durationSec={settings.animationDurationSec}
                  soundEnabled={settings.soundEnabled}
                  soundVolume={settings.soundVolume}
                  accentColor={accent}
                  onComplete={() => setTestMode('winner')}
                />
              </div>
            </div>
          ) : testMode === 'winner' ? (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-auto">
              <WinnerCard
                winner={sampleWinner}
                giveaway={sampleGiveaway}
                accentColor={accent}
              />
            </div>
          ) : (
            <div className={`absolute ${previewPosClass} flex pointer-events-none`}>
              <div
                className="pointer-events-auto transition-all duration-300"
                style={{
                  transform: `scale(${settings.scale || 1})`,
                }}
              >
                <OverlayBadge
                  giveaway={sampleGiveaway}
                  settings={settings}
                  recentJoined={sampleWinner}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Streamer Arrangement Controls: Position Grid & Layout Style */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Screen Position Selector Grid (3x2) */}
        <div className="p-6 rounded-2xl glass-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center space-x-2.5">
              <Layout className="w-4 h-4" style={{ color: accent }} />
              <div>
                <h3 className="text-sm font-bold text-white">Screen Position (Streamer View)</h3>
                <p className="text-[11px] text-neutral-400">Anchor the badge away from your camera, minimap, or HUD</p>
              </div>
            </div>
            <span
              className="text-xs font-mono font-bold px-2 py-0.5 rounded capitalize"
              style={{ backgroundColor: `${accent}20`, color: accent }}
            >
              {settings.position || 'top-right'}
            </span>
          </div>

          {/* Interactive Screen Grid Representation */}
          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-black/40 border border-white/[0.06]">
            {positions.map((pos) => {
              const isActive = (settings.position || 'top-right') === pos.id;
              return (
                <button
                  key={pos.id}
                  onClick={() => onUpdateSettings({ position: pos.id })}
                  className={`p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between h-20 ${
                    isActive
                      ? 'border-2 shadow-lg bg-white/[0.08]'
                      : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12]'
                  }`}
                  style={{
                    borderColor: isActive ? accent : undefined,
                    boxShadow: isActive ? `0 0 16px -2px ${accent}40` : undefined,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-neutral-300'}`}>
                      {pos.label}
                    </span>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: accent }} />
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-400 leading-tight">
                    {pos.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Layout Style Switcher */}
        <div className="p-6 rounded-2xl glass-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center space-x-2.5">
              <Sparkles className="w-4 h-4" style={{ color: accent }} />
              <div>
                <h3 className="text-sm font-bold text-white">Badge Layout Style</h3>
                <p className="text-[11px] text-neutral-400">Choose the graphic style suited for your broadcast</p>
              </div>
            </div>
            <span
              className="text-xs font-mono font-bold px-2 py-0.5 rounded uppercase"
              style={{ backgroundColor: `${accent}20`, color: accent }}
            >
              {settings.layoutStyle || 'pill'}
            </span>
          </div>

          <div className="space-y-2.5">
            {layoutStyles.map((item) => {
              const isActive = (settings.layoutStyle || 'pill') === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onUpdateSettings({ layoutStyle: item.id })}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all duration-200 flex items-center justify-between ${
                    isActive
                      ? 'border-2 shadow-lg bg-white/[0.08]'
                      : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12]'
                  }`}
                  style={{
                    borderColor: isActive ? accent : undefined,
                    boxShadow: isActive ? `0 0 16px -2px ${accent}30` : undefined,
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center flex-shrink-0">
                      {item.id === 'pill' && (
                        <div
                          className="w-5 h-2.5 rounded-full border"
                          style={{ borderColor: isActive ? accent : 'rgba(255,255,255,0.6)' }}
                        />
                      )}
                      {item.id === 'bar' && (
                        <div
                          className="w-5 h-1.5 rounded-sm border"
                          style={{ borderColor: isActive ? accent : 'rgba(255,255,255,0.6)' }}
                        />
                      )}
                      {item.id === 'card' && (
                        <div
                          className="w-4 h-4 rounded-sm border"
                          style={{ borderColor: isActive ? accent : 'rgba(255,255,255,0.6)' }}
                        />
                      )}
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${isActive ? 'text-white' : 'text-neutral-200'}`}>
                        {item.label}
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        {item.desc}
                      </div>
                    </div>
                  </div>
                  {isActive && <Check className="w-4 h-4 flex-shrink-0" style={{ color: accent }} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Visual Settings & OBS Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appearance & Sound Settings */}
        <div className="p-6 rounded-2xl glass-card space-y-5">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-white/[0.08]">
            <Palette className="w-4 h-4" style={{ color: accent }} />
            <h3 className="text-sm font-bold text-white">Accent & Animation Settings</h3>
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
              <span className="font-bold font-mono" style={{ color: accent }}>
                {settings.animationDurationSec}s
              </span>
            </div>
            <input
              type="range"
              min="4"
              max="15"
              step="0.5"
              value={settings.animationDurationSec}
              onChange={(e) => onUpdateSettings({ animationDurationSec: Number(e.target.value) })}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: accent }}
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
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: accent }}
            />
          </div>

          {/* Sound Settings */}
          <div className="pt-3 border-t border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-white block">Mechanical Sound Effects</span>
                <span className="text-[11px] text-neutral-400">Audio ticks during roll and victory fanfare</span>
              </div>
              <button
                onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                className={`p-2 rounded-xl border transition-all ${
                  settings.soundEnabled
                    ? 'bg-white/[0.1] text-white border-white/[0.2]'
                    : 'bg-white/[0.04] text-neutral-500 border-white/[0.08]'
                }`}
                style={{
                  color: settings.soundEnabled ? accent : undefined,
                  borderColor: settings.soundEnabled ? `${accent}40` : undefined,
                }}
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
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: accent }}
                />
              </div>
            )}
          </div>
        </div>

        {/* OBS Setup Instructions */}
        <div className="p-6 rounded-2xl glass-card space-y-4">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-white/[0.08]">
            <Layers className="w-4 h-4" style={{ color: accent }} />
            <h3 className="text-sm font-bold text-white">How to Add to OBS Studio</h3>
          </div>

          <div className="space-y-3 text-xs leading-relaxed text-neutral-300">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
              <div className="font-semibold text-white">1. Create a Browser Source</div>
              <p className="text-neutral-400">
                In OBS Studio, click <strong className="text-white">+</strong> under <strong className="text-white">Sources</strong> and select <strong className="text-white">Browser</strong>. Name it e.g. "Kick Giveaway".
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
              <div className="font-semibold text-white">2. Paste URL & Set Dimensions</div>
              <p className="text-neutral-400">
                Paste your unique Overlay URL and set canvas to standard 1080p:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-black/40 p-2.5 rounded-lg border border-white/[0.08]">
                  Width: <span className="font-bold" style={{ color: accent }}>1920</span>
                </div>
                <div className="bg-black/40 p-2.5 rounded-lg border border-white/[0.08]">
                  Height: <span className="font-bold" style={{ color: accent }}>1080</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
              <div className="font-semibold text-white">3. Audio Control in OBS (Recommended)</div>
              <p className="text-neutral-400">
                Check <strong className="text-white">"Control audio via OBS"</strong> in the browser source properties to route the roulette audio ticks and celebration chime directly into your stream mixer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
