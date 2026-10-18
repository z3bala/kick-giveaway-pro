import React, { useState } from 'react';
import {
  LayoutDashboard,
  Gift,
  Users,
  Tv,
  MessageSquare,
  History,
  Settings,
  Copy,
  Check,
  ExternalLink,
  Radio,
  Lock,
  Unlock,
  Coins,
} from 'lucide-react';

export type TabType =
  | 'overview'
  | 'controls'
  | 'participants'
  | 'gtb'
  | 'overlay'
  | 'simulator'
  | 'history'
  | 'settings';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  participantCount: number;
  giveawayStatus?: string;
  gtbStatus?: string;
  gtbGuessCount?: number;
  kickChannelSlug?: string;
  isKickConnected?: boolean;
  overlayToken?: string;
  isAdminAuthenticated?: boolean;
  onOpenAuthModal?: () => void;
  accentColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  participantCount,
  giveawayStatus = 'draft',
  gtbStatus = 'idle',
  gtbGuessCount = 0,
  kickChannelSlug = '',
  isKickConnected = false,
  overlayToken = '',
  isAdminAuthenticated = false,
  onOpenAuthModal,
  accentColor = '#53fc18',
}) => {
  const [copied, setCopied] = useState(false);

  const navItems = [
    {
      id: 'overview' as TabType,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'controls' as TabType,
      label: 'Giveaway Controls',
      icon: Gift,
      badge:
        giveawayStatus === 'open'
          ? 'Live'
          : giveawayStatus === 'drawing'
          ? 'Rolling'
          : giveawayStatus === 'revealed'
          ? 'Winner'
          : null,
      badgeColor:
        giveawayStatus === 'open'
          ? 'bg-[#53fc18]/20 text-[#53fc18] border border-[#53fc18]/40'
          : giveawayStatus === 'drawing'
          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
          : giveawayStatus === 'revealed'
          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
          : 'bg-white/10 text-white/70',
    },
    {
      id: 'participants' as TabType,
      label: 'Participants',
      icon: Users,
      badge: participantCount > 0 ? `${participantCount}` : null,
      badgeColor: 'bg-white/10 text-white/90 border border-white/10',
    },
    {
      id: 'gtb' as TabType,
      label: 'Guess The Balance',
      icon: Coins,
      badge:
        gtbStatus === 'open'
          ? 'Live'
          : gtbStatus === 'resolved'
          ? 'Winner'
          : gtbGuessCount && gtbGuessCount > 0
          ? `${gtbGuessCount}`
          : null,
      badgeColor:
        gtbStatus === 'open'
          ? 'bg-[#53fc18]/20 text-[#53fc18] border border-[#53fc18]/40'
          : gtbStatus === 'resolved'
          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
          : 'bg-white/10 text-white/70',
    },
    {
      id: 'overlay' as TabType,
      label: 'OBS Overlay',
      icon: Tv,
      badge: 'OBS',
      badgeColor: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    },
    {
      id: 'simulator' as TabType,
      label: 'Chat Simulator',
      icon: MessageSquare,
      badge: null,
    },
    {
      id: 'history' as TabType,
      label: 'History & Winners',
      icon: History,
      badge: null,
    },
    {
      id: 'settings' as TabType,
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  const handleCopyOverlayUrl = () => {
    const origin = window.location.origin;
    const url = `${origin}/overlay${overlayToken ? `?token=${overlayToken}` : ''}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenOverlayWindow = () => {
    const origin = window.location.origin;
    const url = `${origin}/overlay${overlayToken ? `?token=${overlayToken}` : ''}`;
    window.open(url, '_blank', 'width=1280,height=720,menubar=no,toolbar=no');
  };

  return (
    <aside className="w-64 bg-[#0a0d14] border-r border-white/[0.08] flex flex-col justify-between flex-shrink-0 min-h-screen select-none">
      {/* Top Branding & Navigation */}
      <div className="p-4 space-y-6">
        {/* Brand Header */}
        <div className="flex items-center space-x-3 px-2 pt-1">
          <div className="w-9 h-9 rounded-xl bg-[#53fc18]/15 border border-[#53fc18]/40 flex items-center justify-center shadow-lg shadow-[#53fc18]/10 flex-shrink-0">
            <Radio className="w-5 h-5 text-[#53fc18]" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-white text-base tracking-tight">Kick Giveaway</span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-[#53fc18] text-black tracking-wide">
                PRO
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-medium">Live Stream Studio</p>
          </div>
        </div>

        {/* Kick Channel Status Pill Card */}
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400 font-medium">Kick Channel</span>
            <div className="flex items-center space-x-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isKickConnected ? 'bg-[#53fc18] animate-live-pulse' : 'bg-neutral-500'
                }`}
              />
              <span
                className={`font-semibold text-[11px] ${
                  isKickConnected ? 'text-[#53fc18]' : 'text-neutral-400'
                }`}
              >
                {isKickConnected ? 'Connected' : 'Offline'}
              </span>
            </div>
          </div>
          <div className="font-semibold text-white text-xs truncate">
            {kickChannelSlug ? `@${kickChannelSlug}` : 'No channel configured'}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all group ${
                  isActive
                    ? 'bg-white/[0.08] text-white font-semibold shadow-sm border border-white/[0.08]'
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-[#53fc18]' : 'text-neutral-400 group-hover:text-white'
                    }`}
                  />
                  <span className="text-sm">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions: OBS Overlay Quick Copy & Admin Auth */}
      <div className="p-4 border-t border-white/[0.06] space-y-3">
        {/* OBS Quick Source Box */}
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white flex items-center space-x-1.5">
              <Tv className="w-3.5 h-3.5 text-[#53fc18]" />
              <span>OBS Overlay</span>
            </span>
            <button
              onClick={handleOpenOverlayWindow}
              title="Open Overlay in a clean popup"
              className="text-neutral-400 hover:text-white transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-neutral-400 leading-snug">
            Add as Browser Source in OBS (1920x1080)
          </p>
          <button
            onClick={handleCopyOverlayUrl}
            className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
              copied
                ? 'bg-[#53fc18] text-black font-bold'
                : 'bg-white/[0.08] text-neutral-200 hover:bg-white/[0.12] hover:text-white border border-white/[0.08]'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-black" />
                <span>Copied URL!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Overlay Link</span>
              </>
            )}
          </button>
        </div>

        {/* Admin Access Button */}
        {onOpenAuthModal && (
          <button
            onClick={onOpenAuthModal}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-neutral-400 hover:text-white hover:bg-white/[0.04] transition-all"
          >
            <span className="flex items-center space-x-2">
              {isAdminAuthenticated ? (
                <Unlock className="w-3.5 h-3.5 text-[#53fc18]" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-neutral-400" />
              )}
              <span>{isAdminAuthenticated ? 'Admin Unlocked' : 'Admin Security'}</span>
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">
              {isAdminAuthenticated ? 'ACTIVE' : 'LOCKED'}
            </span>
          </button>
        )}
      </div>
    </aside>
  );
};
