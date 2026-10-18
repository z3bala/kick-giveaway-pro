import React, { useState } from 'react';
import {
  Play,
  Square,
  Trophy,
  RotateCcw,
  Plus,
  Megaphone,
  CheckCircle2,
  AlertTriangle,
  Gift,
  KeyRound,
  FileText,
  Dice5,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import type { Giveaway, Participant, OverlaySettings } from '../../shared/types.js';
import { calculateWheelOdds } from '../../shared/wheelOdds.js';

interface GiveawayControlsProps {
  giveaway: Giveaway | null;
  participants: Participant[];
  overlaySettings: OverlaySettings;
  onCreateGiveaway: (
    title: string,
    prize: string,
    keyword: string,
    wheelEnabled?: boolean,
    wheelAmounts?: string[]
  ) => Promise<void>;
  onUpdateWheel?: (wheelEnabled: boolean, wheelAmounts?: string[]) => Promise<void>;
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
  onUpdateWheel,
  onOpenEntries,
  onCloseEntries,
  onUpdateKeyword,
  onStartDraw,
  onRevealWinner,
  onOpenResetConfirmModal,
}) => {
  const [newTitle, setNewTitle] = useState('Kick Stream Giveaway');
  const [newPrize, setNewPrize] = useState('$50 Cash / Gift Card');
  const [newKeyword, setNewKeyword] = useState('!join');
  const [wheelEnabled, setWheelEnabled] = useState(true);
  const [wheelAmountsInput, setWheelAmountsInput] = useState('1$, 2$, 3$, 5$, 10$');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [customKeyword, setCustomKeyword] = useState('');
  const [isEditingKeyword, setIsEditingKeyword] = useState(false);
  const [isEditingWheel, setIsEditingWheel] = useState(false);
  const [activeWheelAmounts, setActiveWheelAmounts] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const status = giveaway?.status || 'draft';
  const isOpen = status === 'open';
  const isClosed = status === 'closed';
  const isDrawing = status === 'drawing';
  const isCompleted = status === 'completed';

  const parseAmounts = (input: string): string[] => {
    return input
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrize.trim() || !newKeyword.trim()) return;

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const parsedWheelAmounts = wheelEnabled ? parseAmounts(wheelAmountsInput) : undefined;
      await onCreateGiveaway(
        newTitle,
        newPrize,
        newKeyword,
        wheelEnabled,
        parsedWheelAmounts && parsedWheelAmounts.length > 0 ? parsedWheelAmounts : undefined
      );
      try {
        await onOpenEntries();
      } catch {}
      setShowCreateForm(false);
      setFeedback({ type: 'success', message: 'Giveaway created and opened! Entries are active.' });
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

  const handleWheelSave = async () => {
    try {
      const parsed = parseAmounts(activeWheelAmounts);
      if (parsed.length === 0) return;
      await onUpdateWheel?.(true, parsed);
      setIsEditingWheel(false);
      setFeedback({ type: 'success', message: `Wheel amounts updated to ${parsed.join(', ')}` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleToggleWheel = async (enabled: boolean) => {
    try {
      const currentAmounts = giveaway?.wheelAmounts || ['1$', '2$', '3$', '5$', '10$'];
      await onUpdateWheel?.(enabled, currentAmounts);
      setFeedback({
        type: 'success',
        message: enabled ? 'Prize wheel enabled!' : 'Prize wheel disabled.',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Page Header with Clear Cache & Reset Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Giveaway Controls</h2>
          <p className="text-xs text-neutral-400 mt-1">
            Manage your active giveaway, open or close viewer registration, and roll the CS2 case-opening animation.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {giveaway && !showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-3.5 py-2 rounded-xl bg-[#53fc18] hover:bg-[#45d914] text-black font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-[#53fc18]/20"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>New Giveaway</span>
            </button>
          )}
          <button
            onClick={onOpenResetConfirmModal}
            className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold flex items-center space-x-1.5 transition-all"
            title="Clear all active giveaway cache and reset state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Cache & Reset</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border flex items-center space-x-2.5 transition-all ${
            feedback.type === 'success'
              ? 'bg-[#53fc18]/10 text-[#53fc18] border-[#53fc18]/30'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {giveaway && !showCreateForm ? (
        <div className="space-y-6">
          {/* Active Giveaway Control Card */}
          <div className="p-6 rounded-2xl glass-card space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="text-xl font-extrabold text-white tracking-tight">{giveaway.title}</h3>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold capitalize border ${
                      isOpen
                        ? 'bg-[#53fc18]/15 text-[#53fc18] border-[#53fc18]/30'
                        : isClosed
                        ? 'bg-amber-400/15 text-amber-300 border-amber-400/30'
                        : isDrawing
                        ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse'
                        : isCompleted
                        ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                        : 'bg-white/10 text-neutral-300 border-white/10'
                    }`}
                  >
                    {status}
                  </span>
                </div>
                <div className="flex items-center space-x-3 mt-2 text-xs text-neutral-400 flex-wrap gap-y-1">
                  <span className="flex items-center space-x-1">
                    <Gift className="w-3.5 h-3.5 text-amber-400" />
                    <span>Prize: <strong className="text-white font-medium">{giveaway.prize}</strong></span>
                  </span>
                  <span>•</span>
                  <span>Participants: <strong className="text-[#53fc18] font-bold">{giveaway.participantCount}</strong></span>
                  {giveaway.wheelEnabled && (
                    <>
                      <span>•</span>
                      <span className="flex items-center space-x-1 text-[#53fc18]">
                        <span>🎡 Wheel:</span>
                        <strong className="font-mono">
                          {(giveaway.wheelAmounts || ['1$', '2$', '3$', '5$', '10$']).join(', ')}
                        </strong>
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-wrap gap-2">
                {/* Inline Keyword Editor */}
                <div className="flex items-center space-x-2 bg-white/[0.04] p-2 rounded-xl border border-white/[0.08]">
                  <KeyRound className="w-4 h-4 text-[#53fc18]" />
                  {isEditingKeyword ? (
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="text"
                        value={customKeyword}
                        onChange={(e) => setCustomKeyword(e.target.value)}
                        placeholder="!keyword"
                        className="bg-black/60 px-2.5 py-1 rounded-lg text-xs font-mono text-white border border-[#53fc18]/50 focus:outline-none w-28"
                      />
                      <button
                        onClick={handleKeywordSave}
                        className="p-1 rounded bg-[#53fc18] text-black hover:bg-[#45d914]"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                      <button
                        onClick={() => setIsEditingKeyword(false)}
                        className="p-1 rounded bg-white/[0.1] text-neutral-300 hover:bg-white/[0.2]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-neutral-400">Keyword:</span>
                      <span className="font-mono font-bold text-[#53fc18]">{giveaway.keyword}</span>
                      <button
                        onClick={() => {
                          setCustomKeyword(giveaway.keyword);
                          setIsEditingKeyword(true);
                        }}
                        className="text-neutral-400 hover:text-white transition-colors"
                        title="Edit keyword"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Inline Wheel Amounts Editor */}
                <div className="flex items-center space-x-2 bg-white/[0.04] p-2 rounded-xl border border-white/[0.08]">
                  <span className="text-xs">🎡</span>
                  {isEditingWheel ? (
                    <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                      <input
                        type="text"
                        value={activeWheelAmounts}
                        onChange={(e) => setActiveWheelAmounts(e.target.value)}
                        placeholder="1$, 2$, 3$, 5$, 10$"
                        className="bg-black/60 px-2.5 py-1 rounded-lg text-xs font-mono text-white border border-[#53fc18]/50 focus:outline-none w-44"
                      />
                      <button
                        onClick={handleWheelSave}
                        className="p-1 rounded bg-[#53fc18] text-black hover:bg-[#45d914]"
                        title="Save amounts"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                      <button
                        onClick={() => setIsEditingWheel(false)}
                        className="p-1 rounded bg-white/[0.1] text-neutral-300 hover:bg-white/[0.2]"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-neutral-400">Prize Wheel:</span>
                      <span className="font-mono font-bold text-[#53fc18]">
                        {giveaway.wheelEnabled
                          ? (giveaway.wheelAmounts || ['1$', '2$', '3$', '5$', '10$']).join(', ')
                          : 'Disabled'}
                      </span>
                      <button
                        onClick={() => {
                          setActiveWheelAmounts(
                            (giveaway.wheelAmounts || ['1$', '2$', '3$', '5$', '10$']).join(', ')
                          );
                          setIsEditingWheel(true);
                        }}
                        className="text-neutral-400 hover:text-white transition-colors"
                        title="Edit wheel amounts"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleWheel(!giveaway.wheelEnabled)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors ${
                          giveaway.wheelEnabled
                            ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                            : 'bg-[#53fc18]/20 text-[#53fc18] hover:bg-[#53fc18]/30'
                        }`}
                      >
                        {giveaway.wheelEnabled ? 'Turn Off' : 'Turn On'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stepper Progression */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  isOpen
                    ? 'bg-[#53fc18]/10 border-[#53fc18]/40 text-[#53fc18]'
                    : 'bg-white/[0.02] border-white/[0.06] text-neutral-400'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Step 1</div>
                <div className="text-xs font-bold mt-0.5 text-white">Registration Open</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">Chat entries accepted</div>
              </div>

              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  isClosed
                    ? 'bg-amber-400/10 border-amber-400/40 text-amber-300'
                    : 'bg-white/[0.02] border-white/[0.06] text-neutral-400'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Step 2</div>
                <div className="text-xs font-bold mt-0.5 text-white">Entries Closed</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">Pool locked for roll</div>
              </div>

              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  isDrawing
                    ? 'bg-purple-500/10 border-purple-500/40 text-purple-300'
                    : 'bg-white/[0.02] border-white/[0.06] text-neutral-400'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Step 3</div>
                <div className="text-xs font-bold mt-0.5 text-white">CS2 Roulette</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">Rolling live on stream</div>
              </div>

              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  isCompleted
                    ? 'bg-blue-500/10 border-blue-500/40 text-blue-300'
                    : 'bg-white/[0.02] border-white/[0.06] text-neutral-400'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Step 4</div>
                <div className="text-xs font-bold mt-0.5 text-white">Winner Revealed</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  {giveaway.winnerUsername ? `@${giveaway.winnerUsername}` : 'Ready for next giveaway'}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {!isOpen && !isDrawing && !isCompleted && (
                <button
                  onClick={onOpenEntries}
                  className="px-5 py-2.5 rounded-xl bg-[#53fc18] hover:bg-[#45d914] text-black font-bold text-xs flex items-center space-x-2 transition-all shadow-md shadow-[#53fc18]/20"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Open Registration ({giveaway.keyword})</span>
                </button>
              )}

              {isOpen && (
                <button
                  onClick={onCloseEntries}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center space-x-2 transition-all shadow-md shadow-amber-500/20"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Close Registration</span>
                </button>
              )}

              {(isClosed || isOpen) && (
                <button
                  onClick={onStartDraw}
                  disabled={giveaway.participantCount === 0 || isDrawing}
                  className={`px-6 py-2.5 rounded-xl bg-[#53fc18] text-black font-bold text-xs flex items-center space-x-2 transition-all shadow-md shadow-[#53fc18]/20 ${
                    giveaway.participantCount === 0 || isDrawing
                      ? 'opacity-40 cursor-not-allowed bg-neutral-600 text-neutral-300'
                      : 'hover:bg-[#45d914]'
                  }`}
                >
                  <Dice5 className="w-4 h-4" />
                  <span>
                    {giveaway.wheelEnabled
                      ? `Spin Wheel & CS2 Roulette (${giveaway.participantCount} Viewers)`
                      : `Roll CS2 Roulette (${giveaway.participantCount} Viewers)`}
                  </span>
                </button>
              )}

              {isDrawing && (
                <button
                  onClick={onRevealWinner}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center space-x-2 transition-all shadow-md animate-pulse"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Reveal Winner Now</span>
                </button>
              )}

              <button
                onClick={onOpenResetConfirmModal}
                className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-neutral-300 border border-white/[0.08] text-xs font-semibold flex items-center space-x-2 transition-all ml-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Giveaway</span>
              </button>
            </div>
          </div>

          {/* Winner Banner if Completed */}
          {isCompleted && giveaway.winnerUsername && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-[#53fc18]/15 via-emerald-950/25 to-[#0f1420] border border-[#53fc18]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-[#53fc18] text-black flex items-center justify-center shadow-lg shadow-[#53fc18]/25 flex-shrink-0">
                  <Trophy className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#53fc18]">
                    Official Winner
                  </div>
                  <div className="text-2xl font-black text-white">
                    @{giveaway.winnerUsername}
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    Prize: {giveaway.prize} • Recorded in history ledger
                  </div>
                </div>
              </div>

              <button
                onClick={onOpenResetConfirmModal}
                className="px-5 py-2.5 rounded-xl bg-[#53fc18] hover:bg-[#45d914] text-black font-bold text-xs transition-all shadow-md"
              >
                Start New Giveaway
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Create Giveaway Form */
        <div className="p-6 rounded-2xl glass-card max-w-xl">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-[#53fc18]/15 border border-[#53fc18]/30 flex items-center justify-center text-[#53fc18]">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Create New Giveaway</h3>
                <p className="text-xs text-neutral-400">Set your prize, title, and the chat entry keyword.</p>
              </div>
            </div>
            {giveaway && (
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.08] hover:bg-white/[0.15] text-neutral-300 transition-colors"
              >
                Back to Active
              </button>
            )}
          </div>

          {giveaway && (
            <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Creating this will automatically archive your previous giveaway and open this one immediately.</span>
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Giveaway Title *
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Friday Community Giveaway"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-white text-sm focus:border-[#53fc18] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Prize Description *
              </label>
              <div className="relative">
                <Gift className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={newPrize}
                  onChange={(e) => setNewPrize(e.target.value)}
                  placeholder="e.g. $50 Steam Card or CS2 Skin"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-white text-sm focus:border-[#53fc18] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Chat Entry Keyword (Must start with !) *
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
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-[#53fc18] font-mono text-sm focus:border-[#53fc18] focus:outline-none transition-colors"
                />
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">
                Viewers enter by typing this keyword into your Kick chat.
              </p>
            </div>

            {/* Prize Wheel Customization Card */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="text-base">🎡</span>
                  <div>
                    <div className="text-xs font-bold text-white">Half-Wheel Prize Spin</div>
                    <div className="text-[11px] text-neutral-400">
                      Spins prize amount first, then rolls who wins the rolled amount
                    </div>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wheelEnabled}
                    onChange={(e) => setWheelEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-black after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#53fc18]" />
                </label>
              </div>

              {wheelEnabled && (
                <div className="pt-2 border-t border-white/[0.06] space-y-2.5 animate-fade-in">
                  <label className="block text-xs font-semibold text-neutral-300">
                    Custom Wheel Amounts (Comma-Separated) *
                  </label>
                  <input
                    type="text"
                    value={wheelAmountsInput}
                    onChange={(e) => setWheelAmountsInput(e.target.value)}
                    placeholder="1$, 2$, 3$, 5$, 10$"
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/[0.1] text-white font-mono text-xs focus:border-[#53fc18] focus:outline-none transition-colors"
                  />

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center space-x-1.5 flex-wrap gap-1 text-[11px]">
                    <span className="text-neutral-500 font-medium mr-1">Presets:</span>
                    {['1$, 2$, 3$', '1$, 2$, 3$, 5$, 10$', '5$, 10$, 25$, 50$'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setWheelAmountsInput(preset)}
                        className="px-2 py-0.5 rounded-md bg-white/[0.06] hover:bg-white/[0.12] text-neutral-300 hover:text-white font-mono transition-colors"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  {/* Live Wedge Preview with Weighted Odds */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                      <span className="text-[10px] uppercase font-bold text-neutral-400">Weighted Odds:</span>
                      {calculateWheelOdds(parseAmounts(wheelAmountsInput)).map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-full bg-[#53fc18]/15 border border-[#53fc18]/30 text-[#53fc18] font-bold text-[11px] font-mono flex items-center space-x-1"
                        >
                          <span>{item.segment}</span>
                          <span className="text-neutral-300 font-sans text-[10px] font-semibold">({item.formattedPercentage})</span>
                        </span>
                      ))}
                    </div>
                    <div className="text-[10px] text-neutral-400 font-sans">
                      ⚡ Weighted odds: the higher the prize amount, the lower the chance is to roll.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-[#53fc18] hover:bg-[#45d914] text-black font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-lg shadow-[#53fc18]/25 mt-2"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{isSubmitting ? 'Creating...' : 'Create Giveaway'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
