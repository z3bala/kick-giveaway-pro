import React, { useState } from 'react';
import {
  Play,
  Square,
  Sparkles,
  RotateCcw,
  PlusCircle,
  Megaphone,
  CheckCircle2,
  AlertTriangle,
  Gift,
  KeyRound,
  FileText,
  Clock,
} from 'lucide-react';
import type { Giveaway, Participant, OverlaySettings } from '../../shared/types.js';

interface GiveawayControlsProps {
  giveaway: Giveaway | null;
  participants: Participant[];
  overlaySettings: OverlaySettings;
  onCreateGiveaway: (title: string, prize: string, keyword: string) => Promise<void>;
  onOpenEntries: () => Promise<void>;
  onCloseEntries: () => Promise<void>;
  onUpdateKeyword: (keyword: string) => Promise<void>;
  onStartDraw: () => Promise<void>;
  onRevealWinner: () => Promise<void>;
  onResetGiveaway: () => Promise<void>;
  onOpenResetConfirmModal: () => void;
}

export const GiveawayControls: React.FC<GiveawayControlsProps> = ({
  giveaway,
  participants,
  overlaySettings,
  onCreateGiveaway,
  onOpenEntries,
  onCloseEntries,
  onUpdateKeyword,
  onStartDraw,
  onRevealWinner,
  onOpenResetConfirmModal,
}) => {
  const [newTitle, setNewTitle] = useState('Sub Sunday Giveaway');
  const [newPrize, setNewPrize] = useState('$50 Steam Gift Card');
  const [newKeyword, setNewKeyword] = useState('!join');
  const [customKeyword, setCustomKeyword] = useState('');
  const [isEditingKeyword, setIsEditingKeyword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const status = giveaway?.status || 'draft';
  const isOpen = status === 'open';
  const isClosed = status === 'closed';
  const isDrawing = status === 'drawing';
  const isCompleted = status === 'completed';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrize.trim() || !newKeyword.trim()) return;

    setIsSubmitting(true);
    setFeedback(null);
    try {
      await onCreateGiveaway(newTitle, newPrize, newKeyword);
      setFeedback({ type: 'success', message: 'Giveaway created successfully!' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeywordSave = async () => {
    if (!customKeyword.trim()) return;
    try {
      await onUpdateKeyword(customKeyword);
      setIsEditingKeyword(false);
      setFeedback({ type: 'success', message: `Entry keyword updated to ${customKeyword}` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Giveaway Controls</h2>
        <p className="text-sm text-neutral-400">
          Create, manage lifecycle states, and trigger CS-style rolls for your Kick channel.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-medium border flex items-center space-x-2 animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Section: Either Active Giveaway Controls or New Giveaway Creation Form */}
      {giveaway ? (
        <div className="space-y-6">
          {/* Active Giveaway Status Card */}
          <div className="p-6 rounded-2xl bg-brand-surface border border-brand-border space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-brand-border">
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="text-xl font-bold text-white">{giveaway.title}</h3>
                  <span
                    className={`text-xs font-mono uppercase px-2.5 py-1 rounded-full font-bold border ${
                      isOpen
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse-subtle'
                        : isClosed
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : isDrawing
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse'
                        : isCompleted
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center space-x-4 mt-2 text-xs text-neutral-400">
                  <span className="flex items-center space-x-1">
                    <Gift className="w-3.5 h-3.5 text-amber-400" />
                    <span>Prize: <strong className="text-white">{giveaway.prize}</strong></span>
                  </span>
                  <span>•</span>
                  <span>Entrants: <strong className="text-white font-mono">{giveaway.participantCount}</strong></span>
                  <span>•</span>
                  <span className="font-mono text-neutral-500">ID: {giveaway.id}</span>
                </div>
              </div>

              {/* Keyword Editor */}
              <div className="flex items-center space-x-2 bg-brand-surface2 px-3 py-2 rounded-xl border border-brand-border">
                <KeyRound className="w-4 h-4 text-neutral-400" />
                {isEditingKeyword ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={customKeyword}
                      onChange={(e) => setCustomKeyword(e.target.value)}
                      placeholder="!newword"
                      className="bg-brand-surface3 px-2 py-1 rounded text-xs font-mono text-white border border-brand-border focus:outline-none w-28"
                    />
                    <button
                      onClick={handleKeywordSave}
                      className="px-2 py-1 rounded bg-emerald-600 text-[11px] font-bold text-white"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditingKeyword(false)}
                      className="px-2 py-1 rounded bg-neutral-700 text-[11px] text-neutral-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-neutral-400">Keyword:</span>
                    <span
                      className="text-xs font-mono font-bold px-2 py-0.5 rounded text-white"
                      style={{ backgroundColor: overlaySettings.accentColor }}
                    >
                      {giveaway.keyword}
                    </span>
                    <button
                      onClick={() => {
                        setCustomKeyword(giveaway.keyword);
                        setIsEditingKeyword(true);
                      }}
                      className="text-[11px] text-neutral-400 hover:text-white underline ml-1"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Lifecycle Phase Progression Stepper */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div
                className={`p-3 rounded-xl border ${
                  isOpen
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-semibold'
                    : 'bg-brand-surface2 border-brand-border text-neutral-400'
                }`}
              >
                <div className="font-mono font-bold text-[10px] text-neutral-500 uppercase">Step 1</div>
                <div className="mt-1 font-bold">1. Registration Open</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">Viewers type {giveaway.keyword}</div>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  isClosed
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-semibold'
                    : 'bg-brand-surface2 border-brand-border text-neutral-400'
                }`}
              >
                <div className="font-mono font-bold text-[10px] text-neutral-500 uppercase">Step 2</div>
                <div className="mt-1 font-bold">2. Registration Closed</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">Entrants list frozen</div>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  isDrawing
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-300 font-semibold'
                    : 'bg-brand-surface2 border-brand-border text-neutral-400'
                }`}
              >
                <div className="font-mono font-bold text-[10px] text-neutral-500 uppercase">Step 3</div>
                <div className="mt-1 font-bold">3. CS-Style Roll</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">OBS horizontal animation</div>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  isCompleted
                    ? 'bg-blue-500/10 border-blue-500/40 text-blue-300 font-semibold'
                    : 'bg-brand-surface2 border-brand-border text-neutral-400'
                }`}
              >
                <div className="font-mono font-bold text-[10px] text-neutral-500 uppercase">Step 4</div>
                <div className="mt-1 font-bold">4. Winner Reveal</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  {giveaway.winnerUsername ? `@${giveaway.winnerUsername}` : 'Chat announcement'}
                </div>
              </div>
            </div>

            {/* Action Buttons Toolbar */}
            <div className="pt-4 flex flex-wrap items-center gap-3">
              {/* Action: Open Entries */}
              {!isOpen && !isDrawing && !isCompleted && (
                <button
                  onClick={onOpenEntries}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-2 shadow-md transition-all"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Open Entries ({giveaway.keyword})</span>
                </button>
              )}

              {/* Action: Close Entries */}
              {isOpen && (
                <button
                  onClick={onCloseEntries}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center space-x-2 shadow-md transition-all"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>Close Registration</span>
                </button>
              )}

              {/* Action: Start CS Roll */}
              {(isClosed || isOpen) && (
                <button
                  onClick={onStartDraw}
                  disabled={giveaway.participantCount === 0 || isDrawing}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white flex items-center space-x-2 shadow-lg transition-all ${
                    giveaway.participantCount === 0 || isDrawing
                      ? 'opacity-40 cursor-not-allowed bg-neutral-700'
                      : 'hover:brightness-110 glow-accent'
                  }`}
                  style={{ backgroundColor: overlaySettings.accentColor }}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Start CS Roll ({giveaway.participantCount} Entrants)</span>
                </button>
              )}

              {/* Action: Reveal & Announce Winner */}
              {isDrawing && (
                <button
                  onClick={onRevealWinner}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center space-x-2 shadow-md transition-all"
                >
                  <Megaphone className="w-4 h-4" />
                  <span>Reveal & Announce In Chat</span>
                </button>
              )}

              {/* Action: Reset for next giveaway */}
              <button
                onClick={onOpenResetConfirmModal}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-neutral-400 hover:text-white bg-brand-surface2 hover:bg-brand-surface3 border border-brand-border flex items-center space-x-2 transition-all ml-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset for Next Giveaway</span>
              </button>
            </div>
          </div>

          {/* Winner Celebration Box if Completed */}
          {isCompleted && giveaway.winnerUsername && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-neutral-900 to-neutral-950 border-2 border-emerald-500/40 shadow-xl flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-bold">
                    Official Giveaway Winner
                  </div>
                  <div className="text-2xl font-black text-white">@{giveaway.winnerUsername}</div>
                  <div className="text-xs text-neutral-400">
                    Prize: {giveaway.prize} • Saved to persistent history
                  </div>
                </div>
              </div>

              <button
                onClick={onOpenResetConfirmModal}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md hover:brightness-110 transition-all"
                style={{ backgroundColor: overlaySettings.accentColor }}
              >
                Start Another Giveaway
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Form: Create New Giveaway */
        <div className="p-6 rounded-2xl bg-brand-surface border border-brand-border max-w-2xl">
          <div className="flex items-center space-x-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: overlaySettings.accentColor }}
            >
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Create a New Giveaway</h3>
              <p className="text-xs text-neutral-400">
                Configure your prize, giveaway title, and chat entry keyword.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-neutral-400 mb-1 font-semibold">
                Giveaway Title
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. 5,000 Followers Celebration Giveaway"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-brand-surface2 border border-brand-border text-white text-sm focus:outline-none focus:border-neutral-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-neutral-400 mb-1 font-semibold">
                Prize Description
              </label>
              <div className="relative">
                <Gift className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={newPrize}
                  onChange={(e) => setNewPrize(e.target.value)}
                  placeholder="e.g. $50 Steam Gift Card / 5 Subscriptions"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-brand-surface2 border border-brand-border text-white text-sm focus:outline-none focus:border-neutral-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-neutral-400 mb-1 font-semibold">
                Chat Entry Keyword (Must start with !)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="!join"
                  pattern="^![a-zA-Z0-9_-]+$"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-brand-surface2 border border-brand-border text-white text-sm font-mono focus:outline-none focus:border-neutral-500 transition-colors"
                />
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">
                Viewers will type this exact keyword in your Kick channel chat to enter.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl text-xs font-bold text-white shadow-lg hover:brightness-110 transition-all flex items-center justify-center space-x-2 mt-4"
              style={{ backgroundColor: overlaySettings.accentColor }}
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating...' : 'Create Giveaway'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
