import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Radio, Lock, ShieldCheck, KeyRound } from 'lucide-react';
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

  const statusColors = {
    connected: 'bg-emerald-500 text-emerald-400 border-emerald-500/30',
    connecting: 'bg-amber-500 text-amber-400 border-amber-500/30',
    disconnected: 'bg-neutral-600 text-neutral-400 border-neutral-600/30',
    error: 'bg-rose-500 text-rose-400 border-rose-500/30',
  };

  return (
    <header className="h-16 border-b border-brand-border bg-brand-surface/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand Identity */}
      <div className="flex items-center space-x-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white shadow-lg text-lg tracking-wider"
          style={{
            background: `linear-gradient(135deg, ${overlaySettings.accentColor}, #f59e0b)`,
          }}
        >
          K
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white text-base tracking-wide">KICK GIVEAWAY PRO</span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-brand-surface3 border border-brand-border text-neutral-300">
              v1.0
            </span>
          </div>
          <div className="text-xs text-neutral-400 font-mono">Real-time Stream Bot & OBS Engine</div>
        </div>
      </div>

      {/* Center Status Indicators */}
      <div className="hidden md:flex items-center space-x-4">
        {/* Kick Status Badge */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-brand-surface2 border border-brand-border text-xs">
          <Radio
            className={`w-3.5 h-3.5 ${
              kickBot.status === 'connected'
                ? 'text-kick-green animate-pulse'
                : kickBot.status === 'connecting'
                ? 'text-amber-400 animate-spin'
                : 'text-neutral-500'
            }`}
          />
          <span className="text-neutral-400">Kick:</span>
          <span className="text-neutral-200 font-mono">
            {kickBot.channelSlug ? `@${kickBot.channelSlug}` : 'Not Set'}
          </span>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold border ${
              statusColors[kickBot.status] || statusColors.disconnected
            }`}
          >
            {kickBot.status}
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* Admin Lock / Unlock status */}
        <button
          onClick={onOpenAuthModal}
          title={isAdminAuthenticated ? 'Admin session active' : 'Click to enter Admin Passphrase'}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 border transition-all ${
            isAdminAuthenticated
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-brand-surface2 text-neutral-400 border-brand-border hover:text-white'
          }`}
        >
          {isAdminAuthenticated ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Key Set</span>
            </>
          ) : (
            <>
              <KeyRound className="w-3.5 h-3.5" />
              <span>Set Admin Key</span>
            </>
          )}
        </button>

        {/* Copy OBS URL button */}
        <button
          onClick={copyOverlayUrl}
          className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 bg-brand-surface2 border border-brand-border text-neutral-200 hover:bg-brand-surface3 hover:text-white transition-all shadow-sm"
          title="Copy OBS Browser Source URL"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-neutral-400" />
              <span>Copy OBS URL</span>
            </>
          )}
        </button>

        {/* Launch Overlay In New Tab */}
        <a
          href={getOverlayUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 text-white shadow-md hover:brightness-110 transition-all"
          style={{ backgroundColor: overlaySettings.accentColor }}
        >
          <span>Open Overlay</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </header>
  );
};
