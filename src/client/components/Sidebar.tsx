import React from 'react';
import {
  LayoutDashboard,
  Trophy,
  Users,
  MonitorPlay,
  Terminal,
  History,
  Settings,
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
  accentColor = '#e11d48',
}) => {
  const navItems = [
    {
      id: 'overview' as TabType,
      label: 'Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'controls' as TabType,
      label: 'Giveaway Controls',
      icon: Trophy,
      badge: giveawayStatus && giveawayStatus !== 'draft' ? giveawayStatus.toUpperCase() : null,
      badgeColor: giveawayStatus === 'open' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-400',
    },
    {
      id: 'participants' as TabType,
      label: 'Participants',
      icon: Users,
      badge: participantCount > 0 ? String(participantCount) : null,
      badgeColor: 'bg-brand-surface3 text-neutral-300',
    },
    {
      id: 'overlay' as TabType,
      label: 'Overlay Studio',
      icon: MonitorPlay,
      badge: null,
    },
    {
      id: 'simulator' as TabType,
      label: 'Chat Simulator',
      icon: Terminal,
      badge: 'TEST',
      badgeColor: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    },
    {
      id: 'history' as TabType,
      label: 'Giveaway History',
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

  return (
    <aside className="w-64 border-r border-brand-border bg-brand-surface flex flex-col justify-between p-4 flex-shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="space-y-1">
        <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold px-3 py-2">
          Management
        </div>

        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-brand-surface3 text-white shadow-sm border border-brand-border'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-brand-surface2'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className="w-4 h-4 transition-colors"
                  style={{ color: isActive ? accentColor : undefined }}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Streamer Quick Tips Footer */}
      <div className="p-3.5 rounded-xl bg-brand-surface2 border border-brand-border text-[11px] text-neutral-400">
        <div className="font-semibold text-neutral-200 mb-1 flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-kick-green" />
          <span>OBS Scene Integration</span>
        </div>
        <p className="leading-relaxed">
          Add a Browser Source at <code className="text-white font-mono">1920x1080</code> with transparency enabled.
        </p>
      </div>
    </aside>
  );
};
