import React, { useState } from 'react';
import {
  Coins,
  Trophy,
  CheckCircle2,
  Lock,
  Unlock,
  Play,
  RotateCcw,
  Search,
  Plus,
  HelpCircle,
  Copy,
  Check,
  TrendingUp,
  ArrowUpDown,
  Sparkles,
  Target,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import type { GtbEvent, GtbGuess } from '../../shared/types.js';

interface GuessTheBalanceProps {
  gtbEvent: GtbEvent | null;
  gtbGuesses: GtbGuess[];
  onCreateEvent: (title: string, prize: string, keyword?: string) => Promise<void>;
  onCloseEvent: () => Promise<void>;
  onResolveEvent: (finalBalance: number) => Promise<void>;
  onResetEvent: () => Promise<void>;
  onManualGuess?: (username: string, guess: number) => Promise<void>;
  accentColor?: string;
}

export const GuessTheBalance: React.FC<GuessTheBalanceProps> = ({
  gtbEvent,
  gtbGuesses,
  onCreateEvent,
  onCloseEvent,
  onResolveEvent,
  onResetEvent,
  onManualGuess,
  accentColor = '#53fc18',
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('Ending Stake.com Balance Guess');
  const [prize, setPrize] = useState('$50 Stake Tip / Gift Card');
  const [keyword, setKeyword] = useState('!gtb');

  const [actualBalanceInput, setActualBalanceInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedChatHelper, setCopiedChatHelper] = useState(false);
  const [manualUser, setManualUser] = useState('');
  const [manualGuessVal, setManualGuessVal] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const status = gtbEvent?.status || 'idle';
  const isOpen = status === 'open';
  const isClosed = status === 'closed';
  const isResolved = status === 'resolved';

  // Statistical calculations
  const totalGuesses = gtbGuesses.length;
  const guessValues = gtbGuesses.map((g) => g.guess);
  const avgGuess = totalGuesses > 0 ? guessValues.reduce((a, b) => a + b, 0) / totalGuesses : 0;
  const minGuess = totalGuesses > 0 ? Math.min(...guessValues) : 0;
  const maxGuess = totalGuesses > 0 ? Math.max(...guessValues) : 0;

  // Filter & sort guesses
  const filteredGuesses = gtbGuesses
    .filter((g) => g.username.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (isResolved && typeof a.diff === 'number' && typeof b.diff === 'number') {
        return a.diff - b.diff;
      }
      return b.guess - a.guess;
    });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !prize.trim()) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await onCreateEvent(title, prize, keyword);
      setShowCreateModal(false);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalVal = parseFloat(actualBalanceInput);
    if (isNaN(finalVal) || finalVal < 0) {
      setErrorMsg('Please enter a valid ending balance number.');
      return;
    }
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await onResolveEvent(finalVal);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(manualGuessVal);
    if (!manualUser.trim() || isNaN(val) || val < 0) return;
    try {
      await onManualGuess?.(manualUser.trim(), val);
      setManualUser('');
      setManualGuessVal('');
      setShowManualForm(false);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const copyChatInstruction = async () => {
    const cmd = gtbEvent?.keyword || '!gtb';
    const text = `🎰 GUESS THE BALANCE: Guess my finishing balance on Stake.com! Type ${cmd} <amount> in chat (e.g. ${cmd} 260) to enter! 1 guess per viewer (predictions cannot be changed). Prize: ${gtbEvent?.prize || '$50'}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedChatHelper(true);
      setTimeout(() => setCopiedChatHelper(false), 2500);
    } catch {}
  };

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-[#53fc18]/15 border border-[#53fc18]/30 text-[#53fc18]">
                <Coins className="w-5 h-5" />
              </span>
              <span>Guess The Balance (GTB)</span>
            </h2>
            <span className="px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-bold font-mono">
              STAKE.COM EVENT
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Let your viewers guess your final finishing balance on Stake.com with{' '}
            <code className="text-[#53fc18] font-mono">{gtbEvent?.keyword || '!gtb'} 260</code>.
            Click <strong className="text-white">"Closest Prediction"</strong> at the end of the stream to automatically pick the closest winner!
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {!gtbEvent || isResolved ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-[#53fc18] hover:bg-[#45d914] text-black font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-[#53fc18]/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Start GTB Event</span>
            </button>
          ) : (
            <button
              onClick={onResetEvent}
              className="px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-neutral-300 font-semibold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Reset current GTB event"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Event</span>
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Streamer Chat Instruction Quick Copy */}
      {gtbEvent && (
        <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/40 via-[#0d1525]/80 to-[#0d1525]/80 border border-[#53fc18]/25 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-[#53fc18] font-bold">💬 Chat Announcement Helper:</span>
            <span className="text-neutral-300 font-mono text-[11px] truncate max-w-xl">
              Type <strong className="text-[#53fc18]">{gtbEvent.keyword} &lt;amount&gt;</strong> (e.g.{' '}
              {gtbEvent.keyword} 260) to enter! • 1 guess per viewer (predictions are locked)
            </span>
          </div>
          <button
            onClick={copyChatInstruction}
            className="px-2.5 py-1 rounded-lg bg-[#53fc18]/15 hover:bg-[#53fc18]/25 border border-[#53fc18]/30 text-[#53fc18] text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
          >
            {copiedChatHelper ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Chat Message</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Active Event Overview & Resolver Card */}
      {gtbEvent ? (
        <div className="space-y-4">
          {/* Status & Resolver Bar */}
          <div className="p-5 rounded-2xl bg-[#0c111e]/90 border border-white/[0.08] backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
              <div>
                <div className="flex items-center space-x-2.5">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border flex items-center space-x-1.5 ${
                      isOpen
                        ? 'bg-[#53fc18]/15 text-[#53fc18] border-[#53fc18]/40 animate-pulse'
                        : isClosed
                        ? 'bg-amber-400/15 text-amber-300 border-amber-400/40'
                        : 'bg-purple-500/15 text-purple-300 border-purple-500/40'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isOpen ? 'bg-[#53fc18]' : isClosed ? 'bg-amber-400' : 'bg-purple-400'
                      }`}
                    />
                    <span>
                      {isOpen ? 'Open for Guesses' : isClosed ? 'Guesses Locked' : 'Winner Resolved'}
                    </span>
                  </span>
                  <h3 className="text-base font-bold text-white tracking-tight">{gtbEvent.title}</h3>
                </div>

                <div className="flex items-center space-x-4 mt-2 text-xs text-neutral-400">
                  <span>
                    Prize: <strong className="text-white font-medium">{gtbEvent.prize}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Keyword: <strong className="text-[#53fc18] font-mono">{gtbEvent.keyword}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Total Predictions:{' '}
                    <strong className="text-[#53fc18] font-mono font-bold">{totalGuesses}</strong>
                  </span>
                </div>
              </div>

              {/* Action Buttons for Closing / Locking */}
              <div className="flex items-center space-x-2">
                {isOpen && (
                  <button
                    onClick={onCloseEvent}
                    className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Lock Predictions</span>
                  </button>
                )}
                {isClosed && (
                  <button
                    onClick={() => onCreateEvent(gtbEvent.title, gtbEvent.prize, gtbEvent.keyword)}
                    className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-neutral-300 font-semibold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Re-open</span>
                  </button>
                )}
              </div>
            </div>

            {/* "Closest Prediction" Resolver Input & Action */}
            {!isResolved ? (
              <form
                onSubmit={handleResolveSubmit}
                className="p-4 rounded-xl bg-black/40 border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <Target className="w-4 h-4 text-[#53fc18]" />
                    <span>End of Stream Balance Resolution:</span>
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    Type your finishing Stake.com balance below. The system will find the viewer with the closest guess!
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-wrap">
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-neutral-400 text-xs font-mono font-bold">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={actualBalanceInput}
                      onChange={(e) => setActualBalanceInput(e.target.value)}
                      placeholder="e.g. 254.20"
                      className="w-36 pl-6 pr-3 py-2 rounded-xl bg-black/60 border border-white/[0.15] text-white font-mono text-sm focus:border-[#53fc18] focus:outline-none transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading || totalGuesses === 0}
                    className="px-4 py-2 rounded-xl bg-[#53fc18] hover:bg-[#45d914] text-black font-black text-xs flex items-center space-x-1.5 shadow-md shadow-[#53fc18]/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Closest Prediction</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Resolved Winner Spotlight Card */
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/40 via-black/40 to-emerald-950/40 border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                    <Trophy className="w-6 h-6 stroke-[2]" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
                      🏆 WINNING CLOSEST PREDICTION
                    </div>
                    <div className="text-base font-black text-white flex items-center space-x-2">
                      <span>@{gtbEvent.winnerUsername}</span>
                      <span className="text-xs text-neutral-400 font-normal">won</span>
                      <span className="text-[#53fc18]">{gtbEvent.prize}</span>
                    </div>
                    <div className="text-xs text-neutral-300 mt-0.5 font-mono">
                      Finished Balance:{' '}
                      <strong className="text-white">${gtbEvent.finalBalance?.toFixed(2)}</strong> •
                      Guess: <strong className="text-[#53fc18]">${gtbEvent.winnerGuess?.toFixed(2)}</strong> •
                      Difference: <strong className="text-amber-400">${gtbEvent.winnerDiff?.toFixed(2)} away</strong>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onResetEvent}
                  className="px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Start New Event</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-[#0c111e]/90 border border-white/[0.06]">
              <div className="text-[10px] font-bold uppercase text-neutral-400">Total Predictions</div>
              <div className="text-xl font-black text-[#53fc18] font-mono mt-0.5">{totalGuesses}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0c111e]/90 border border-white/[0.06]">
              <div className="text-[10px] font-bold uppercase text-neutral-400">Average Guess</div>
              <div className="text-xl font-black text-white font-mono mt-0.5">
                ${avgGuess.toFixed(2)}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0c111e]/90 border border-white/[0.06]">
              <div className="text-[10px] font-bold uppercase text-neutral-400">Lowest Guess</div>
              <div className="text-xl font-black text-amber-300 font-mono mt-0.5">
                ${minGuess.toFixed(2)}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0c111e]/90 border border-white/[0.06]">
              <div className="text-[10px] font-bold uppercase text-neutral-400">Highest Guess</div>
              <div className="text-xl font-black text-blue-400 font-mono mt-0.5">
                ${maxGuess.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Predictions Leaderboard Table */}
          <div className="p-5 rounded-2xl bg-[#0c111e]/90 border border-white/[0.08] backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-white">Viewer Predictions</h4>
                <p className="text-[11px] text-neutral-400">
                  {isResolved
                    ? 'Sorted by closest distance to final balance'
                    : 'Real-time viewer guesses from Kick chat'}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search viewer..."
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.1] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#53fc18] w-40"
                  />
                </div>

                {isOpen && (
                  <button
                    onClick={() => setShowManualForm(!showManualForm)}
                    className="px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-neutral-300 text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Guess</span>
                  </button>
                )}
              </div>
            </div>

            {/* Manual Guess Input Drawer */}
            {showManualForm && (
              <form
                onSubmit={handleManualAdd}
                className="p-3 rounded-xl bg-black/40 border border-white/[0.08] flex items-center space-x-2 flex-wrap gap-y-2 animate-fade-in"
              >
                <input
                  type="text"
                  required
                  placeholder="Viewer username"
                  value={manualUser}
                  onChange={(e) => setManualUser(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.1] text-xs text-white focus:outline-none focus:border-[#53fc18]"
                />
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Guess amount"
                  value={manualGuessVal}
                  onChange={(e) => setManualGuessVal(e.target.value)}
                  className="w-28 px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.1] text-xs font-mono text-white focus:outline-none focus:border-[#53fc18]"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-[#53fc18] hover:bg-[#45d914] text-black font-bold text-xs cursor-pointer"
                >
                  Save Prediction
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualForm(false)}
                  className="px-2 py-1.5 rounded-lg bg-white/[0.08] text-neutral-300 text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </form>
            )}

            {filteredGuesses.length === 0 ? (
              <div className="py-12 text-center text-neutral-500 text-xs">
                {totalGuesses === 0
                  ? `No predictions yet! Tell viewers in chat to type ${gtbEvent.keyword} <amount> (e.g. ${gtbEvent.keyword} 260)`
                  : 'No predictions matched your search.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-neutral-400 text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Viewer</th>
                      <th className="py-2.5 px-3">Guess Amount</th>
                      {isResolved && <th className="py-2.5 px-3">Distance / Diff</th>}
                      <th className="py-2.5 px-3 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredGuesses.map((g, idx) => {
                      const isWinnerCard = isResolved && idx === 0;
                      return (
                        <tr
                          key={g.id}
                          className={`hover:bg-white/[0.02] transition-colors ${
                            isWinnerCard ? 'bg-purple-500/10 font-bold' : ''
                          }`}
                        >
                          <td className="py-2 px-3 text-neutral-400 font-mono">
                            {isWinnerCard ? '🏆 1' : idx + 1}
                          </td>
                          <td className="py-2 px-3 text-white font-medium">
                            <span className="text-[#53fc18]">@</span>
                            {g.username}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-white">
                            ${g.guess.toFixed(2)}
                          </td>
                          {isResolved && (
                            <td className="py-2 px-3 font-mono">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  isWinnerCard
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                    : 'bg-white/[0.04] text-neutral-300'
                                }`}
                              >
                                {typeof g.diff === 'number'
                                  ? `${g.diff === 0 ? 'EXACT MATCH!' : `±$${g.diff.toFixed(2)}`}`
                                  : '-'}
                              </span>
                            </td>
                          )}
                          <td className="py-2 px-3 text-right text-neutral-500 text-[11px] font-mono">
                            {new Date(g.updatedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
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
      ) : (
        /* Empty State: Create First Event */
        <div className="py-16 px-6 rounded-2xl bg-[#0c111e]/90 border border-white/[0.08] backdrop-blur-xl text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#53fc18]/15 border border-[#53fc18]/30 flex items-center justify-center mx-auto text-[#53fc18]">
            <Coins className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No Active Guess The Balance Event</h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            Start a Guess The Balance event so your Kick viewers can predict your finishing Stake.com balance!
            At the end of your stream, click <strong>"Closest Prediction"</strong> and the bot will announce the winner.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 rounded-xl bg-[#53fc18] hover:bg-[#45d914] text-black font-black text-xs flex items-center space-x-1.5 mx-auto shadow-lg shadow-[#53fc18]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create GTB Event</span>
          </button>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#0e1424] border border-white/[0.1] shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Coins className="w-5 h-5 text-[#53fc18]" />
                <span>New Guess The Balance Event</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Ending Stake.com Balance Guess"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/[0.1] text-white text-xs focus:border-[#53fc18] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Prize for Winner *
                </label>
                <input
                  type="text"
                  required
                  value={prize}
                  onChange={(e) => setPrize(e.target.value)}
                  placeholder="e.g. $50 Stake Tip / Gift Card"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/[0.1] text-white text-xs focus:border-[#53fc18] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Chat Command Keyword *
                </label>
                <input
                  type="text"
                  required
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="!gtb"
                  pattern="^![a-zA-Z0-9_-]+$"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/[0.1] text-[#53fc18] font-mono text-xs focus:border-[#53fc18] focus:outline-none"
                />
                <p className="text-[10px] text-neutral-400 mt-1">
                  Viewers enter by typing <code className="text-[#53fc18] font-mono">{keyword} &lt;amount&gt;</code> in chat.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-neutral-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-[#53fc18] hover:bg-[#45d914] text-black font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-[#53fc18]/20"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Start Event</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
