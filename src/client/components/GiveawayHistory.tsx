import React, { useState } from 'react';
import { History, Trophy, Users, Calendar, Gift, Search } from 'lucide-react';
import type { Giveaway } from '../../shared/types.js';

interface GiveawayHistoryProps {
  history: Giveaway[];
  accentColor?: string;
}

export const GiveawayHistory: React.FC<GiveawayHistoryProps> = ({
  history,
  accentColor = '#e63946',
}) => {
  const [search, setSearch] = useState('');

  const filtered = history.filter((g) => {
    const text = `${g.title} ${g.prize} ${g.winnerUsername || ''}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1b1f2e]">
        <div>
          <h2 className="text-xl font-black text-white tracking-wider uppercase telemetry">
            Historical Audit Ledger
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Immutable persistent ledger of completed giveaway manifests and drawn victors.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit records..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#11141e] border border-[#1e2436] text-xs telemetry text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-xl border border-[#1b1f2e] bg-[#0c0e15] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-neutral-500 text-xs telemetry">
            {search ? `NO RECORDS MATCHED "${search.toUpperCase()}"` : 'LEDGER EMPTY // NO COMPLETED DRAWS RECORDED'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1b1f2e] bg-[#10131d] text-[9px] telemetry uppercase text-neutral-400 tracking-wider">
                  <th className="py-2.5 px-4">MANIFEST // PRIZE</th>
                  <th className="py-2.5 px-4">TRIGGER</th>
                  <th className="py-2.5 px-4">POOL VOLUME</th>
                  <th className="py-2.5 px-4">CONFIRMED VICTOR</th>
                  <th className="py-2.5 px-4">DATE COMPLETED</th>
                  <th className="py-2.5 px-4">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#181c2b] text-xs telemetry">
                {filtered.map((g) => {
                  const dateStr = new Date(g.completedAt || g.createdAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr key={g.id} className="hover:bg-[#121622] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white font-sans text-xs">{g.title}</div>
                        <div className="text-[11px] text-neutral-400 flex items-center space-x-1 mt-0.5 font-sans">
                          <Gift className="w-3 h-3 text-amber-400" />
                          <span>{g.prize}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-neutral-300 text-xs">
                        {g.keyword}
                      </td>

                      <td className="py-3 px-4 text-neutral-300">
                        <div className="flex items-center space-x-1.5">
                          <Users className="w-3 h-3 text-neutral-500" />
                          <span>{g.participantCount} ENTRANTS</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {g.winnerUsername ? (
                          <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                            <Trophy className="w-3 h-3 text-[#53fc18]" />
                            <span>@{g.winnerUsername}</span>
                          </div>
                        ) : (
                          <span className="text-neutral-500 italic">None drawn</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-neutral-400 text-[11px]">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="w-3 h-3 text-neutral-500" />
                          <span>{dateStr}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            g.status === 'completed'
                              ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                              : 'bg-neutral-800 text-neutral-400'
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
