import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Radio, Lock, Unlock, Tv } from 'lucide-react';
import type { KickBotState, OverlaySettings } from '../../shared/types.js';

interface HeaderProps {
  currentTabName: string;
  kickBot: KickBotState;
  overlaySettings: OverlaySettings;
  overlayToken?: string;
  onOpenAuthModal: () => void;
  isAdminAuthenticated: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTabName,
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
    <header className="h-16 bg-[#0c0f17]/80 backdrop-blur-md border-b border-white/[0.08] px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Current Page Title */}
      <div className="flex items-center space-x-3">
        <h1 className="text-lg font-bold text-white tracking-tight">{currentTabName}</h1>
        <span className="text-xs text-neutral-500 font-medium hidden sm:inline">•</span>
        <span className="text-xs text-neutral-400 font-medium hidden sm:inline">
          Kick Stream Assistant
        </span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-3">
        {/* Kick Connection Pill */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              kickBot.status === 'connected'
                ? 'bg-[#53fc18] animate-live-pulse'
                : kickBot.status === 'connecting'
                ? 'bg-amber-400 animate-pulse'
                : 'bg-neutral-500'
            }`}
          />
          <span className="text-neutral-400 font-medium">Kick:</span>
          <span className="font-semibold text-white">
            {kickBot.channelSlug ? `@${kickBot.channelSlug}` : 'Disconnected'}
          </span>
        </div>

        {/* Copy OBS Link Button */}
        <button
          onClick={copyOverlayUrl}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 border transition-all ${
            copied
              ? 'bg-[#53fc18] text-black border-[#53fc18] font-semibold'
              : 'bg-white/[0.04] text-neutral-300 border-white/[0.08] hover:bg-white/[0.08] hover:text-white'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-neutral-400" />
              <span>Copy OBS URL</span>
            </>
          )}
        </button>

        {/* View OBS Overlay In New Tab */}
        <a
          href={getOverlayUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 bg-[#53fc18] text-black hover:bg-[#45d914] transition-all shadow-sm shadow-[#53fc18]/20"
        >
          <Tv className="w-3.5 h-3.5" />
          <span>Launch Overlay</span>
          <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
        </a>

        {/* Admin Unlock Icon */}
        <button
          onClick={onOpenAuthModal}
          title={isAdminAuthenticated ? 'Admin Unlocked' : 'Unlock Admin Controls'}
          className={`p-2 rounded-lg border transition-all ${
            isAdminAuthenticated
              ? 'bg-[#53fc18]/10 text-[#53fc18] border-[#53fc18]/30 hover:bg-[#53fc18]/20'
              : 'bg-white/[0.04] text-neutral-400 border-white/[0.08] hover:text-white hover:bg-white/[0.08]'
          }`}
        >
          {isAdminAuthenticated ? (
            <Unlock className="w-4 h-4 text-[#53fc18]" />
          ) : (
            <Lock className="w-4 h-4 text-neutral-400" />
          )}
        </button>
      </div>
    </header>
  );
};
