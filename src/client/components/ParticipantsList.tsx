import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  UserX,
  UserPlus,
  Download,
  Clock,
  Shield,
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
    link.setAttribute('download', `kick_giveaway_pool_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeCount = participants.filter((p) => p.status === 'active').length;

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1b1f2e]">
        <div>
          <h2 className="text-xl font-black text-white tracking-wider uppercase telemetry">
            Entrant Roster & Pool
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Audit, verify, and moderate verified viewers in the current giveaway pool.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenManualAddModal}
            className="px-3 py-1.5 rounded-lg text-xs telemetry font-bold bg-[#141722] hover:bg-[#1c2234] border border-[#23293c] text-neutral-200 hover:text-white transition-all flex items-center space-x-2"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>MANUAL INJECT</span>
          </button>

          <button
            onClick={exportCSV}
            disabled={participants.length === 0}
            className={`px-3 py-1.5 rounded-lg text-xs telemetry font-bold bg-[#141722] border border-[#23293c] text-neutral-200 transition-all flex items-center space-x-2 ${
              participants.length === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#1c2234] hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 rounded-xl tactical-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search entrant handle..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#11141e] border border-[#1e2436] text-xs telemetry text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400"
          />
        </div>

        <div className="flex items-center space-x-1.5 text-xs telemetry">
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-2.5 py-1 rounded font-bold transition-all ${
              filterStatus === 'active'
                ? 'bg-[#181d2b] text-white border border-[#293248]'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            ACTIVE ({activeCount})
          </button>
          <button
            onClick={() => setFilterStatus('removed')}
            className={`px-2.5 py-1 rounded font-bold transition-all ${
              filterStatus === 'removed'
                ? 'bg-[#181d2b] text-white border border-[#293248]'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            REMOVED ({participants.length - activeCount})
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-2.5 py-1 rounded font-bold transition-all ${
              filterStatus === 'all'
                ? 'bg-[#181d2b] text-white border border-[#293248]'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            ALL ({participants.length})
          </button>
        </div>
      </div>

      {/* Telemetry Table */}
      <div className="rounded-xl border border-[#1b1f2e] bg-[#0c0e15] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-neutral-500 text-xs telemetry">
            {search
              ? `NO ENTRANTS MATCHED QUERY "${search.toUpperCase()}"`
              : 'ROSTER EMPTY // WAITING FOR REGISTRATIONS'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1b1f2e] bg-[#10131d] text-[9px] telemetry uppercase text-neutral-400 tracking-wider">
                  <th className="py-2.5 px-4">TICKET</th>
                  <th className="py-2.5 px-4">HANDLE</th>
                  <th className="py-2.5 px-4">KICK IDENTITY</th>
                  <th className="py-2.5 px-4">TIME ENTERED</th>
                  <th className="py-2.5 px-4">STATUS</th>
                  <th className="py-2.5 px-4 text-right">OVERRIDE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#181c2b] text-xs telemetry">
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
                      className={`hover:bg-[#121622] transition-colors ${
                        isRemoved ? 'opacity-40' : ''
                      }`}
                    >
                      <td className="py-2.5 px-4 text-neutral-500 text-[11px]">
                        #{String(index + 1).padStart(3, '0')}
                      </td>

                      <td className="py-2.5 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div
                            className="w-6 h-6 rounded flex items-center justify-center font-bold text-white text-[10px]"
                            style={{ backgroundColor: overlaySettings.accentColor }}
                          >
                            {p.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-white">@{p.username}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-4 text-neutral-400 text-[11px]">
                        {p.kickUserId}
                      </td>

                      <td className="py-2.5 px-4 text-neutral-400 text-[11px]">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          <span>{joinTimeStr}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-4">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            isRemoved
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      <td className="py-2.5 px-4 text-right">
                        {!isRemoved && (
                          <button
                            onClick={() => onRemoveParticipant(p)}
                            title="Disqualify entrant from draw"
                            className="p-1 rounded text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <UserX className="w-3.5 h-3.5" />
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
