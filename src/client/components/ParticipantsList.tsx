import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  UserX,
  UserPlus,
  Download,
  Clock,
  X,
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
    <div className="space-y-6 max-w-5xl pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Participants Pool</h2>
          <p className="text-xs text-neutral-400 mt-1">
            View all viewers who entered the giveaway with the chat keyword.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={onOpenManualAddModal}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#53fc18] hover:bg-[#45d914] text-black transition-all shadow-sm flex items-center space-x-1.5"
          >
            <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Viewer</span>
          </button>

          <button
            onClick={exportCSV}
            disabled={participants.length === 0}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/[0.06] border border-white/[0.08] text-neutral-200 transition-all flex items-center space-x-1.5 ${
              participants.length === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/[0.12] hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-2xl glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-black/40 border border-white/[0.1] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#53fc18] transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06] text-xs">
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterStatus === 'active'
                ? 'bg-white/[0.1] text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilterStatus('removed')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterStatus === 'removed'
                ? 'bg-white/[0.1] text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Removed ({participants.length - activeCount})
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterStatus === 'all'
                ? 'bg-white/[0.1] text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            All ({participants.length})
          </button>
        </div>
      </div>

      {/* Participants Table */}
      <div className="rounded-2xl glass-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <Users className="w-8 h-8 text-neutral-600 mx-auto" />
            <p className="text-sm font-medium text-neutral-400">
              {search ? `No participants matching "${search}"` : 'No participants in this giveaway yet'}
            </p>
            <p className="text-xs text-neutral-500">
              {search ? 'Try clearing your search query' : 'Entries will appear automatically as viewers chat the keyword'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  <th className="py-3 px-5">#</th>
                  <th className="py-3 px-5">Viewer</th>
                  <th className="py-3 px-5">Kick User ID</th>
                  <th className="py-3 px-5">Joined At</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs">
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
                      className={`hover:bg-white/[0.02] transition-colors ${
                        isRemoved ? 'opacity-40' : ''
                      }`}
                    >
                      <td className="py-3 px-5 text-neutral-500 font-mono text-[11px]">
                        {index + 1}
                      </td>

                      <td className="py-3 px-5">
                        <div className="flex items-center space-x-3">
                          <div className="w-7 h-7 rounded-lg bg-[#53fc18]/15 text-[#53fc18] font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {p.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-white">@{p.username}</span>
                        </div>
                      </td>

                      <td className="py-3 px-5 text-neutral-400 font-mono text-[11px]">
                        {p.kickUserId}
                      </td>

                      <td className="py-3 px-5 text-neutral-400">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          <span>{joinTimeStr}</span>
                        </div>
                      </td>

                      <td className="py-3 px-5">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize border ${
                            isRemoved
                              ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                              : 'bg-[#53fc18]/15 text-[#53fc18] border-[#53fc18]/30'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      <td className="py-3 px-5 text-right">
                        {!isRemoved && (
                          <button
                            onClick={() => onRemoveParticipant(p)}
                            title="Remove viewer from draw"
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
