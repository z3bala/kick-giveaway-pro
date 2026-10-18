import React, { useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket.js';
import { api } from '../utils/api.js';
import type { SlotTournament, SlotMatch } from '../../shared/types.js';
import { Swords, Trophy, Crown, Sparkles } from 'lucide-react';

export const SlotTournamentOverlay: React.FC = () => {
  const queryParams = new URLSearchParams(window.location.search);
  const token = queryParams.get('token') || undefined;

  const { connected, tournament: socketTournament } = useSocket({
    clientType: 'overlay',
    token,
  });

  const [tournament, setTournament] = useState<SlotTournament | null>(null);

  // Sync from socket or fetch initial state
  useEffect(() => {
    if (socketTournament) {
      setTournament(socketTournament);
    } else {
      api
        .getTournamentStatus()
        .then((state) => {
          if (state?.activeTournament) {
            setTournament(state.activeTournament);
          }
        })
        .catch(() => {});
    }
  }, [socketTournament]);

  // Apply overlay body mode
  useEffect(() => {
    document.documentElement.classList.add('overlay-mode');
    document.body.classList.add('overlay-mode');
    return () => {
      document.documentElement.classList.remove('overlay-mode');
      document.body.classList.remove('overlay-mode');
    };
  }, []);

  // Group matches by round
  const rounds: { index: number; name: string; matches: SlotMatch[] }[] = [];
  if (tournament && tournament.matches) {
    const maxRound = Math.max(...tournament.matches.map((m) => m.roundIndex), 0);
    for (let r = 0; r <= maxRound; r++) {
      const roundMatches = tournament.matches.filter((m) => m.roundIndex === r);
      if (roundMatches.length > 0) {
        rounds.push({
          index: r,
          name: roundMatches[0].roundName,
          matches: roundMatches,
        });
      }
    }
  }

  // Active / current match
  const activeMatch =
    tournament?.matches.find((m) => m.id === tournament.currentMatchId && m.status !== 'completed') ||
    tournament?.matches.find((m) => m.status === 'ready' && !m.winnerName);

  if (!tournament || tournament.status === 'setup' || tournament.status === 'cancelled') {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-8 pointer-events-none select-none">
        <div className="bg-[#0b0e17]/90 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center space-y-2 shadow-2xl animate-fade-in max-w-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-[#53fc18] flex items-center justify-center mx-auto">
            <Swords className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Slot Battle Tournament</h2>
          <p className="text-xs text-neutral-400">
            {tournament?.status === 'setup'
              ? `Configuring "${tournament.slotName}" bracket...`
              : 'Standby • Waiting for tournament to start'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen bg-transparent select-none overflow-hidden p-6 md:p-8 flex flex-col justify-between pointer-events-none font-sans">
      {/* Top Stream Header */}
      <div className="flex items-center justify-between z-20">
        <div className="flex items-center space-x-3 bg-[#0a0d17]/95 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/[0.12] shadow-2xl">
          <span className="p-2 rounded-xl bg-gradient-to-tr from-[#53fc18] to-emerald-400 text-black shadow-lg shadow-emerald-500/20">
            <Swords className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                Slot Battle
              </span>
              <span className="text-neutral-500">•</span>
              <span className="text-[11px] font-mono text-neutral-300">
                {tournament.size} Players
              </span>
            </div>
            <h1 className="text-lg font-extrabold text-white tracking-wide">
              {tournament.slotName}
            </h1>
          </div>
        </div>

        {/* Current Active Match Banner */}
        {tournament.status === 'in_progress' && activeMatch && (
          <div className="flex items-center space-x-3 bg-[#111627]/95 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-amber-400/40 shadow-2xl shadow-amber-500/10 animate-fade-in">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <div className="text-right">
              <span className="block text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                Current Match • {activeMatch.roundName}
              </span>
              <span className="text-sm font-extrabold text-white">
                {activeMatch.player1Name || 'TBD'} <span className="text-neutral-500 font-normal">vs</span> {activeMatch.player2Name || 'TBD'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Center Esports Bracket View */}
      <div className="flex-1 flex items-center justify-center my-auto z-10">
        <div className="w-full max-w-[1720px] bg-[#080b13]/85 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 shadow-2xl">
          <div className="flex items-stretch justify-around gap-6">
            {rounds.map((round, rIdx) => {
              const isFinalRound = rIdx === rounds.length - 1;

              return (
                <div key={round.index} className="flex-1 flex flex-col space-y-3 min-w-[200px]">
                  {/* Round Header */}
                  <div className="text-center pb-2 border-b border-white/[0.08]">
                    <span className="text-xs font-black uppercase tracking-wider text-neutral-300">
                      {round.name}
                    </span>
                  </div>

                  {/* Matches Column */}
                  <div className="flex-1 flex flex-col justify-around space-y-4 py-2">
                    {round.matches.map((match, mIdx) => {
                      const isCurrent = tournament.currentMatchId === match.id && match.status !== 'completed';
                      const isDone = match.status === 'completed';

                      return (
                        <div
                          key={match.id}
                          className={`relative rounded-xl border p-2.5 transition-all ${
                            isCurrent
                              ? 'bg-[#182033]/95 border-amber-400 shadow-xl shadow-amber-500/20 ring-2 ring-amber-400/40 scale-[1.02]'
                              : isDone
                              ? 'bg-[#0f1422]/90 border-white/[0.08]'
                              : 'bg-white/[0.02] border-white/[0.04]'
                          }`}
                        >
                          {/* Match Index / Status */}
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[9px] font-mono text-neutral-500 uppercase">
                              {isFinalRound ? 'Championship' : `Match ${mIdx + 1}`}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest animate-pulse">
                                Live
                              </span>
                            )}
                          </div>

                          {/* Player 1 Card */}
                          <div
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg mb-1 transition-all ${
                              match.winnerName === match.player1Name && match.player1Name
                                ? 'bg-gradient-to-r from-[#53fc18]/25 to-emerald-500/20 border border-[#53fc18]/60 text-white font-black'
                                : match.winnerName && match.winnerName !== match.player1Name
                                ? 'opacity-30 text-neutral-500 line-through'
                                : 'bg-white/[0.04] text-neutral-200 font-semibold'
                            }`}
                          >
                            <span className="text-xs truncate max-w-[140px]">
                              {match.player1Name || <span className="italic text-neutral-600">Waiting...</span>}
                            </span>
                            {match.winnerName === match.player1Name && match.player1Name && (
                              <Crown className="w-3.5 h-3.5 text-[#53fc18] shrink-0" />
                            )}
                          </div>

                          {/* Player 2 Card */}
                          <div
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all ${
                              match.winnerName === match.player2Name && match.player2Name
                                ? 'bg-gradient-to-r from-[#53fc18]/25 to-emerald-500/20 border border-[#53fc18]/60 text-white font-black'
                                : match.winnerName && match.winnerName !== match.player2Name
                                ? 'opacity-30 text-neutral-500 line-through'
                                : 'bg-white/[0.04] text-neutral-200 font-semibold'
                            }`}
                          >
                            <span className="text-xs truncate max-w-[140px]">
                              {match.player2Name || <span className="italic text-neutral-600">Waiting...</span>}
                            </span>
                            {match.winnerName === match.player2Name && match.player2Name && (
                              <Crown className="w-3.5 h-3.5 text-[#53fc18] shrink-0" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Champion Reveal Modal Overlay (When Completed) */}
      {tournament.status === 'completed' && tournament.champion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/60 backdrop-blur-sm animate-fade-in pointer-events-none">
          <div className="bg-gradient-to-b from-[#181d11]/95 via-[#10141f]/95 to-[#090b12]/95 border-2 border-yellow-400/80 rounded-3xl p-8 max-w-lg w-full text-center space-y-4 shadow-2xl shadow-yellow-500/30 animate-scale-up">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-yellow-400 via-amber-300 to-yellow-500 text-black flex items-center justify-center mx-auto shadow-2xl shadow-yellow-400/50 animate-bounce">
              <Trophy className="w-12 h-12" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center space-x-1.5 text-yellow-400 text-xs font-black uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Slot Battle Champion</span>
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-4xl font-black text-white tracking-tight drop-shadow-md">
                👑 {tournament.champion}
              </h2>
              <p className="text-sm text-neutral-300">
                Champion of <span className="text-amber-400 font-bold">{tournament.slotName}</span>!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <div className="flex items-center justify-between text-[11px] text-neutral-500 px-2 z-20">
        <span>Kick Giveaway Pro • Slot Battle System</span>
        <span>Live Bracket Updates</span>
      </div>
    </div>
  );
};
