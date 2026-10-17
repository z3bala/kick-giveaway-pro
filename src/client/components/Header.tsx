import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Radio, ShieldCheck, KeyRound, Activity } from 'lucide-react';
import type { KickBotState, OverlaySettings } from '../../shared/types.js';

interface HeaderProps {
  kickBot: KickBotState;
  overlaySettings: OverlaySettings;
  overlayToken?: string;
  onOpenAuthModal: () => void;
  isAdminAuthenticated: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  kickBot,
  overlaySettings,
  overlayToken,
  onOpenAuthModal,
  isAdminAuthenticated,
}) => {
  const [copied, setCopied] = useState(false);

  const getOverlayUrl = () => {
    const origin = window.location.origin;
    const tokenParam = overlayToken ? `?token=${encodeURIComponent(overlayToken)}` : '';
    return `${origin}/overlay${tokenParam}`;
  };

  const copyOverlayUrl = async () => {
    try {
      await navigator.clipboard.writeText(getOverlayUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <header className="h-14 border-b border-[#1b1f2e] bg-[#0c0e15] px-5 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Brand Identity / Broadcast Callout */}
      <div className="flex items-center space-x-3.5">
        <div className="flex items-center space-x-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-white text-xs tracking-wider shadow-sm"
            style={{ backgroundColor: overlaySettings.accentColor }}
          >
            KP
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-white text-sm tracking-wider uppercase">
                Kick Giveaway Pro
              </span>
              <span className="text-[9px] telemetry px-1.5 py-0.2 rounded bg-[#161a26] border border-[#23293d] text-neutral-400 font-semibold">
                OPS v1.0
              </span>
            </div>
            <span className="text-[10px] text-neutral-400 telemetry">
              BROADCAST COMMAND DECK
            </span>
          </div>
        </div>
      </div>

      {/* Center Telemetry Status */}
      <div className="hidden lg:flex items-center space-x-3">
        {/* Kick Stream Uplink */}
        <div className="flex items-center space-x-2 px-3 py-1 rounded-md bg-[#11141e] border border-[#1d2232] text-xs">
          <div
            className={`w-2 h-2 rounded-full ${
              kickBot.status === 'connected'
                ? 'bg-[#53fc18] led-beacon'
                : kickBot.status === 'connecting'
                ? 'bg-amber-400 animate-ping'
                : 'bg-neutral-600'
            }`}
          />
          <span className="text-[11px] telemetry text-neutral-400 uppercase">Kick Uplink:</span>
          <span className="text-[11px] telemetry font-semibold text-neutral-200">
            {kickBot.channelSlug ? `@${kickBot.channelSlug}` : 'DISCONNECTED'}
          </span>
          <span
            className={`text-[9px] telemetry px-1.5 py-0.5 rounded font-bold uppercase ${
              kickBot.status === 'connected'
                ? 'bg-[#53fc18]/15 text-[#53fc18]'
                : kickBot.status === 'connecting'
                ? 'bg-amber-400/15 text-amber-300'
                : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            {kickBot.status}
          </span>
        </div>

        {/* WebSocket Signal */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#11141e] border border-[#1d2232] text-[11px] telemetry text-neutral-400">
          <Activity className="w-3.5 h-3.5 text-neutral-400" />
          <span>SOCKET 60FPS</span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-2.5">
        {/* Admin Session Key Button */}
        <button
          onClick={onOpenAuthModal}
          className={`px-2.5 py-1.5 rounded-lg text-xs telemetry font-medium flex items-center space-x-1.5 border transition-all ${
            isAdminAuthenticated
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-[#141722] text-neutral-400 border-[#22273a] hover:text-white'
          }`}
        >
          {isAdminAuthenticated ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>KEY AUTHENTICATED</span>
            </>
          ) : (
            <>
              <KeyRound className="w-3.5 h-3.5" />
              <span>AUTH LOCK</span>
            </>
          )}
        </button>

        {/* Copy OBS URL button */}
        <button
          onClick={copyOverlayUrl}
          className="px-3 py-1.5 rounded-lg text-xs telemetry font-medium flex items-center space-x-1.5 bg-[#141722] border border-[#22273a] text-neutral-300 hover:bg-[#1a1e2d] hover:text-white transition-all shadow-sm"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">COPIED</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-neutral-400" />
              <span>COPY OBS URL</span>
            </>
          )}
        </button>

        {/* Open Overlay In New Tab */}
        <a
          href={getOverlayUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-lg text-xs telemetry font-bold flex items-center space-x-1.5 text-white shadow-sm hover:brightness-110 transition-all uppercase tracking-wider"
          style={{ backgroundColor: overlaySettings.accentColor }}
        >
          <span>VIEW OVERLAY</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </header>
  );
};
