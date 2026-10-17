import React, { useState } from 'react';
import { History, Trophy, Users, Calendar, Gift, CheckCircle2, Search } from 'lucide-react';
import type { Giveaway } from '../../shared/types.js';

interface GiveawayHistoryProps {
  history: Giveaway[];
  accentColor?: string;
}

export const GiveawayHistory: React.FC<GiveawayHistoryProps> = ({
  history,
  accentColor = '#e11d48',
}) => {
  const [search, setSearch] = useState('');

  const filtered = history.filter((g) => {
    const text = `${g.title} ${g.prize} ${g.winnerUsername || ''}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Giveaway History</h2>
          <p className="text-sm text-neutral-400">
            Persistent archive of completed and previous channel giveaways.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search past giveaways or winners..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-brand-surface2 border border-brand-border text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
          />
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-2xl bg-brand-surface border border-brand-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-neutral-500 text-xs">
            {search ? `No giveaways matched "${search}"` : 'No past giveaways recorded yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border bg-brand-surface2 text-[10px] font-mono uppercase text-neutral-400">
                  <th className="py-3 px-4">Title & Prize</th>
                  <th className="py-3 px-4">Keyword</th>
                  <th className="py-3 px-4">Participants</th>
                  <th className="py-3 px-4">Winner</th>
                  <th className="py-3 px-4">Date Completed</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border text-xs">
                {filtered.map((g) => {
                  const dateStr = new Date(g.completedAt || g.createdAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr key={g.id} className="hover:bg-brand-surface2/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{g.title}</div>
                        <div className="text-xs text-neutral-400 flex items-center space-x-1 mt-0.5">
                          <Gift className="w-3 h-3 text-amber-400" />
                          <span>{g.prize}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-neutral-300 text-xs">
                        {g.keyword}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-neutral-300">
                        <div className="flex items-center space-x-1.5">
                          <Users className="w-3.5 h-3.5 text-neutral-500" />
                          <span>{g.participantCount}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {g.winnerUsername ? (
                          <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                            <Trophy className="w-3.5 h-3.5 text-amber-400" />
                            <span>@{g.winnerUsername}</span>
                          </div>
                        ) : (
                          <span className="text-neutral-500 italic">None selected</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-neutral-400 font-mono text-[11px]">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                          <span>{dateStr}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                            g.status === 'completed'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
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
