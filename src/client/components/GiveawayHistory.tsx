import React, { useState } from 'react';
import { History, Trophy, Users, Calendar, Gift, Search, X } from 'lucide-react';
import type { Giveaway } from '../../shared/types.js';

interface GiveawayHistoryProps {
  history: Giveaway[];
  accentColor?: string;
}

export const GiveawayHistory: React.FC<GiveawayHistoryProps> = ({ history }) => {
  const [search, setSearch] = useState('');

  const filtered = history.filter((g) => {
    const text = `${g.title} ${g.prize} ${g.winnerUsername || ''}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 max-w-5xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Giveaway History & Winners</h2>
          <p className="text-xs text-neutral-400 mt-1">
            Browse all past giveaways, prizes, entrant counts, and confirmed winners.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search past giveaways..."
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
      </div>

      {/* Table */}
      <div className="rounded-2xl glass-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <History className="w-8 h-8 text-neutral-600 mx-auto" />
            <p className="text-sm font-medium text-neutral-400">
              {search ? `No giveaways matching "${search}"` : 'No past giveaways recorded yet'}
            </p>
            <p className="text-xs text-neutral-500">
              Completed giveaways will be archived here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  <th className="py-3 px-5">Giveaway & Prize</th>
                  <th className="py-3 px-5">Keyword</th>
                  <th className="py-3 px-5">Entrants</th>
                  <th className="py-3 px-5">Winner</th>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs">
                {filtered.map((g) => {
                  const dateStr = new Date(g.completedAt || g.createdAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr key={g.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-5">
                        <div className="font-semibold text-white text-xs">{g.title}</div>
                        <div className="text-[11px] text-neutral-400 flex items-center space-x-1 mt-0.5">
                          <Gift className="w-3 h-3 text-amber-400" />
                          <span>{g.prize}</span>
                        </div>
                      </td>

                      <td className="py-3 px-5 font-mono text-[#53fc18] text-xs">
                        {g.keyword}
                      </td>

                      <td className="py-3 px-5 text-neutral-300">
                        <div className="flex items-center space-x-1.5">
                          <Users className="w-3.5 h-3.5 text-neutral-500" />
                          <span>{g.participantCount} viewers</span>
                        </div>
                      </td>

                      <td className="py-3 px-5">
                        {g.winnerUsername ? (
                          <div className="flex items-center space-x-1.5 text-[#53fc18] font-semibold">
                            <Trophy className="w-3.5 h-3.5 text-[#53fc18]" />
                            <span>@{g.winnerUsername}</span>
                          </div>
                        ) : (
                          <span className="text-neutral-500 italic">None selected</span>
                        )}
                      </td>

                      <td className="py-3 px-5 text-neutral-400 text-[11px]">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="w-3 h-3 text-neutral-500" />
                          <span>{dateStr}</span>
                        </div>
                      </td>

                      <td className="py-3 px-5">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize border ${
                            g.status === 'completed'
                              ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                              : 'bg-white/10 text-neutral-400 border-white/10'
                          }`}
                        >
                          {g.status}
                        </span>
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
