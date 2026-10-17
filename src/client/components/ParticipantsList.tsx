import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  UserX,
  UserPlus,
  Download,
  Clock,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import type { Participant, OverlaySettings } from '../../shared/types.js';

interface ParticipantsListProps {
  participants: Participant[];
  overlaySettings: OverlaySettings;
  giveawayId?: string;
  onRemoveParticipant: (participant: Participant) => void;
  onOpenManualAddModal: () => void;
}

export const ParticipantsList: React.FC<ParticipantsListProps> = ({
  participants,
  overlaySettings,
  giveawayId,
  onRemoveParticipant,
  onOpenManualAddModal,
}) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'removed'>('active');

  const filtered = useMemo(() => {
    return participants.filter((p) => {
      const matchesSearch = p.username.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [participants, search, filterStatus]);

  const exportCSV = () => {
    if (participants.length === 0) return;
    const header = 'Kick User ID,Username,Joined At,Status\n';
    const rows = participants
      .map((p) => `"${p.kickUserId}","${p.username}","${p.joinedAt}","${p.status}"`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `kick_giveaway_participants_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeCount = participants.filter((p) => p.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Participants</h2>
          <p className="text-sm text-neutral-400">
            View, search, verify, and moderate entrants for the current giveaway.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenManualAddModal}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand-surface2 hover:bg-brand-surface3 border border-brand-border text-neutral-200 hover:text-white transition-all flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Manual Entry</span>
          </button>

          <button
            onClick={exportCSV}
            disabled={participants.length === 0}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand-surface2 border border-brand-border text-neutral-200 transition-all flex items-center space-x-2 ${
              participants.length === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-brand-surface3 hover:text-white'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-brand-surface border border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search entrant username..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-brand-surface2 border border-brand-border text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterStatus === 'active'
                ? 'bg-brand-surface3 text-white border border-brand-border font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilterStatus('removed')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterStatus === 'removed'
                ? 'bg-brand-surface3 text-white border border-brand-border font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Removed ({participants.length - activeCount})
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterStatus === 'all'
                ? 'bg-brand-surface3 text-white border border-brand-border font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            All ({participants.length})
          </button>
        </div>
      </div>

      {/* Participants Table */}
      <div className="rounded-2xl bg-brand-surface border border-brand-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-neutral-500 text-xs">
            {search
              ? `No participants matched "${search}"`
              : 'No participants have entered yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border bg-brand-surface2 text-[10px] font-mono uppercase text-neutral-400">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Entrant</th>
                  <th className="py-3 px-4">Kick Identity</th>
                  <th className="py-3 px-4">Joined At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border text-xs">
                {filtered.map((p, index) => {
                  const isRemoved = p.status === 'removed';
                  const joinTimeStr = new Date(p.joinedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-brand-surface2/50 transition-colors ${
                        isRemoved ? 'opacity-50' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-neutral-500 font-mono text-[11px]">
                        {index + 1}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-sm flex-shrink-0"
                            style={{
                              background: `linear-gradient(135deg, ${overlaySettings.accentColor}, #f59e0b)`,
                            }}
                          >
                            {p.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-white tracking-wide">
                            @{p.username}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-neutral-400 text-[11px]">
                        {p.kickUserId}
                      </td>

                      <td className="py-3 px-4 text-neutral-400 font-mono text-[11px]">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-neutral-500" />
                          <span>{joinTimeStr}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                            isRemoved
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {!isRemoved && (
                          <button
                            onClick={() => onRemoveParticipant(p)}
                            title="Remove participant from giveaway"
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
