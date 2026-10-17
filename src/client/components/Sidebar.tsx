import React from 'react';
import {
  LayoutDashboard,
  Trophy,
  Users,
  MonitorPlay,
  Terminal,
  History,
  Sliders,
  Layers,
} from 'lucide-react';

export type TabType =
  | 'overview'
  | 'controls'
  | 'participants'
  | 'overlay'
  | 'simulator'
  | 'history'
  | 'settings';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  participantCount: number;
  giveawayStatus?: string;
  accentColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  participantCount,
  giveawayStatus,
  accentColor = '#e63946',
}) => {
  const navItems = [
    {
      id: 'overview' as TabType,
      label: 'OVERVIEW',
      sublabel: 'System Status & Feed',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'controls' as TabType,
      label: 'CONTROL DECK',
      sublabel: 'Giveaway Master Switches',
      icon: Trophy,
      badge: giveawayStatus && giveawayStatus !== 'draft' ? giveawayStatus.toUpperCase() : null,
      badgeColor:
        giveawayStatus === 'open'
          ? 'bg-[#53fc18]/15 text-[#53fc18] border border-[#53fc18]/30'
          : giveawayStatus === 'drawing'
          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
          : 'bg-[#181d2a] text-neutral-400 border border-[#252c40]',
    },
    {
      id: 'participants' as TabType,
      label: 'ENTRANT ROSTER',
      sublabel: 'Participant Pool & Mod',
      icon: Users,
      badge: participantCount > 0 ? `${participantCount}` : null,
      badgeColor: 'bg-[#181d2a] text-neutral-300 border border-[#252c40]',
    },
    {
      id: 'overlay' as TabType,
      label: 'OVERLAY STUDIO',
      sublabel: 'OBS Source & CS2 Roll',
      icon: MonitorPlay,
      badge: null,
    },
    {
      id: 'simulator' as TabType,
      label: 'CHAT TERMINAL',
      sublabel: 'Simulate & Rehearse',
      icon: Terminal,
      badge: 'TEST',
      badgeColor: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    },
    {
      id: 'history' as TabType,
      label: 'AUDIT LEDGER',
      sublabel: 'Completed Records',
      icon: History,
      badge: null,
    },
    {
      id: 'settings' as TabType,
      label: 'SYSTEM CONFIG',
      sublabel: 'Kick API & Rate Limits',
      icon: Sliders,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 border-r border-[#1b1f2e] bg-[#0c0e15] flex flex-col justify-between p-3.5 flex-shrink-0 min-h-[calc(100vh-3.5rem)] select-none">
      <div className="space-y-1">
        <div className="text-[10px] telemetry uppercase tracking-widest text-neutral-400 font-bold px-3 py-2">
          DECK MODULES
        </div>

        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all ${
                isActive
                  ? 'bg-[#151925] border border-[#262c42] shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#11141e]'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className="w-4 h-4 transition-colors flex-shrink-0"
                  style={{ color: isActive ? accentColor : undefined }}
                />
                <div className="flex flex-col">
                  <span
                    className={`text-xs font-bold tracking-wider telemetry ${
                      isActive ? 'text-white' : 'text-neutral-300'
                    }`}
                  >
                    {item.label}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-sans leading-tight">
                    {item.sublabel}
                  </span>
                </div>
              </div>

              {item.badge && (
                <span
                  className={`text-[9px] telemetry px-2 py-0.5 rounded font-bold uppercase ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Broadcast Hardware Rack Telemetry */}
      <div className="p-3 rounded-lg bg-[#10131d] border border-[#1b202e] text-[11px] telemetry text-neutral-400 space-y-1.5">
        <div className="flex items-center justify-between text-neutral-300 font-bold text-[10px]">
          <span className="flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-neutral-400" />
            <span>OBS BROWSER FEED</span>
          </span>
          <span className="text-[#53fc18]">60 FPS</span>
        </div>
        <div className="text-[10px] text-neutral-400 font-mono">
          1920x1080 • Alpha Transparency
        </div>
      </div>
    </aside>
  );
};
