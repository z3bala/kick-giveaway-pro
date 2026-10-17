import React, { useState } from 'react';
import {
  Play,
  Square,
  Crosshair,
  RotateCcw,
  Plus,
  Megaphone,
  CheckCircle2,
  AlertTriangle,
  Gift,
  KeyRound,
  FileText,
  Layers,
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
  const [newTitle, setNewTitle] = useState('Championship Knife Giveaway');
  const [newPrize, setNewPrize] = useState('M9 Bayonet | Fade (Factory New)');
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
      setFeedback({ type: 'success', message: 'Giveaway manifest initialized successfully.' });
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
      <div className="pb-4 border-b border-[#1b1f2e]">
        <h2 className="text-xl font-black text-white tracking-wider uppercase telemetry">
          Master Control Deck
        </h2>
        <p className="text-xs text-neutral-400 mt-0.5">
          Authoritative state machine, registration triggers, and CS2 case-opening roll engagement.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-lg text-xs telemetry font-medium border flex items-center space-x-2 animate-fade-in ${
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

      {/* Main Section: Either Active Giveaway Controls or New Creation Form */}
      {giveaway ? (
        <div className="space-y-5">
          {/* Active Manifest Deck */}
          <div className="p-5 rounded-xl tactical-surface space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1b202e]">
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-bold text-white tracking-wide">{giveaway.title}</h3>
                  <span
                    className={`text-[10px] telemetry uppercase px-2 py-0.5 rounded font-bold border ${
                      isOpen
                        ? 'bg-[#53fc18]/15 text-[#53fc18] border-[#53fc18]/30 led-beacon'
                        : isClosed
                        ? 'bg-amber-400/15 text-amber-300 border-amber-400/30'
                        : isDrawing
                        ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse'
                        : isCompleted
                        ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    STATE: {status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center space-x-3 mt-1.5 text-xs text-neutral-400 telemetry">
                  <span className="flex items-center space-x-1">
                    <Gift className="w-3.5 h-3.5 text-amber-400" />
                    <span>PRIZE: <strong className="text-white font-sans">{giveaway.prize}</strong></span>
                  </span>
                  <span>•</span>
                  <span>ENTRANTS: <strong className="text-white font-bold">{giveaway.participantCount}</strong></span>
                  <span>•</span>
                  <span className="text-neutral-400">ID: {giveaway.id.slice(0, 14)}</span>
                </div>
              </div>

              {/* Inline Keyword Editor */}
              <div className="flex items-center space-x-2 bg-[#121622] px-3 py-1.5 rounded-lg border border-[#1e2436]">
                <KeyRound className="w-3.5 h-3.5 text-neutral-400" />
                {isEditingKeyword ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={customKeyword}
                      onChange={(e) => setCustomKeyword(e.target.value)}
                      placeholder="!keyword"
                      className="bg-[#181d2a] px-2 py-1 rounded text-xs telemetry text-white border border-[#2b334a] focus:outline-none w-28"
                    />
                    <button
                      onClick={handleKeywordSave}
                      className="px-2 py-1 rounded bg-emerald-600 text-[10px] telemetry font-bold text-white uppercase"
                    >
                      SAVE
                    </button>
                    <button
                      onClick={() => setIsEditingKeyword(false)}
                      className="px-2 py-1 rounded bg-neutral-700 text-[10px] telemetry text-neutral-300 uppercase"
                    >
                      CANCEL
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] telemetry text-neutral-400 uppercase">Trigger:</span>
                    <span
                      className="text-xs telemetry font-bold px-2 py-0.5 rounded text-white"
                      style={{ backgroundColor: overlaySettings.accentColor }}
                    >
                      {giveaway.keyword}
                    </span>
                    <button
                      onClick={() => {
                        setCustomKeyword(giveaway.keyword);
                        setIsEditingKeyword(true);
                      }}
                      className="text-[10px] telemetry text-neutral-400 hover:text-white underline ml-1"
                    >
                      EDIT
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Lifecycle Phase Progression Stepper */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
              <div
                className={`p-3 rounded-lg border ${
                  isOpen
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-semibold'
                    : 'bg-[#11141e] border-[#1c2232] text-neutral-400'
                }`}
              >
                <div className="telemetry font-bold text-[9px] text-neutral-400 uppercase">PHASE 01</div>
                <div className="mt-0.5 font-bold telemetry text-xs">1. REGISTRATION OPEN</div>
                <div className="text-[10px] text-neutral-400 mt-0.5">Chat entrants accepted</div>
              </div>

              <div
                className={`p-3 rounded-lg border ${
                  isClosed
                    ? 'bg-amber-400/10 border-amber-400/40 text-amber-300 font-semibold'
                    : 'bg-[#11141e] border-[#1c2232] text-neutral-400'
                }`}
              >
                <div className="telemetry font-bold text-[9px] text-neutral-400 uppercase">PHASE 02</div>
                <div className="mt-0.5 font-bold telemetry text-xs">2. ROSTER FROZEN</div>
                <div className="text-[10px] text-neutral-400 mt-0.5">Pool locked for draw</div>
              </div>

              <div
                className={`p-3 rounded-lg border ${
                  isDrawing
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-300 font-semibold'
                    : 'bg-[#11141e] border-[#1c2232] text-neutral-400'
                }`}
              >
                <div className="telemetry font-bold text-[9px] text-neutral-400 uppercase">PHASE 03</div>
                <div className="mt-0.5 font-bold telemetry text-xs">3. CS2 ROULETTE</div>
                <div className="text-[10px] text-neutral-400 mt-0.5">OBS roll engaged</div>
              </div>

              <div
                className={`p-3 rounded-lg border ${
                  isCompleted
                    ? 'bg-blue-500/10 border-blue-500/40 text-blue-300 font-semibold'
                    : 'bg-[#11141e] border-[#1c2232] text-neutral-400'
                }`}
              >
                <div className="telemetry font-bold text-[9px] text-neutral-400 uppercase">PHASE 04</div>
                <div className="mt-0.5 font-bold telemetry text-xs">4. VICTOR DECLARED</div>
                <div className="text-[10px] text-neutral-400 mt-0.5">
                  {giveaway.winnerUsername ? `@${giveaway.winnerUsername}` : 'Ledger updated'}
                </div>
              </div>
            </div>

            {/* Tactical Action Switches */}
            <div className="pt-3 flex flex-wrap items-center gap-2.5">
              {/* Arm Entries */}
              {!isOpen && !isDrawing && !isCompleted && (
                <button
                  onClick={onOpenEntries}
                  className="px-5 py-2.5 rounded-lg text-xs telemetry font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-2 shadow-sm transition-all uppercase"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>ARM REGISTRATION ({giveaway.keyword})</span>
                </button>
              )}

              {/* Close Entries */}
              {isOpen && (
                <button
                  onClick={onCloseEntries}
                  className="px-5 py-2.5 rounded-lg text-xs telemetry font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center space-x-2 shadow-sm transition-all uppercase"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>FREEZE REGISTRATION</span>
                </button>
              )}

              {/* Engage CS2 Roll */}
              {(isClosed || isOpen) && (
                <button
                  onClick={onStartDraw}
                  disabled={giveaway.participantCount === 0 || isDrawing}
                  className={`px-6 py-2.5 rounded-lg text-xs telemetry font-bold text-white flex items-center space-x-2 shadow-sm transition-all uppercase ${
                    giveaway.participantCount === 0 || isDrawing
                      ? 'opacity-40 cursor-not-allowed bg-neutral-700'
                      : 'hover:brightness-110'
                  }`}
                  style={{ backgroundColor: overlaySettings.accentColor }}
                >
                  <Crosshair className="w-4 h-4" />
                  <span>ENGAGE CS2 ROLL ({giveaway.participantCount} ENTRANTS)</span>
                </button>
              )}

              {/* Reveal & Broadcast in Chat */}
              {isDrawing && (
                <button
                  onClick={onRevealWinner}
                  className="px-5 py-2.5 rounded-lg text-xs telemetry font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center space-x-2 shadow-sm transition-all uppercase"
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>BROADCAST TO KICK CHAT</span>
                </button>
              )}

              {/* Reset Manifest */}
              <button
                onClick={onOpenResetConfirmModal}
                className="px-4 py-2.5 rounded-lg text-xs telemetry font-semibold text-neutral-400 hover:text-white bg-[#141722] hover:bg-[#1b202f] border border-[#23293c] flex items-center space-x-2 transition-all ml-auto uppercase"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RESET MANIFEST</span>
              </button>
            </div>
          </div>

          {/* Victor Banner if Completed */}
          {isCompleted && giveaway.winnerUsername && (
            <div className="p-5 rounded-xl bg-gradient-to-r from-[#0d1512] to-[#0a1012] border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] uppercase telemetry tracking-wider text-emerald-400 font-bold">
                    OFFICIAL DRAW WINNER
                  </div>
                  <div className="text-2xl font-black text-white telemetry">
                    @{giveaway.winnerUsername}
                  </div>
                  <div className="text-xs text-neutral-400">
                    Prize: {giveaway.prize} • Archived in ledger
                  </div>
                </div>
              </div>

              <button
                onClick={onOpenResetConfirmModal}
                className="px-4 py-2 rounded-lg text-xs telemetry font-bold text-white shadow-sm hover:brightness-110 transition-all uppercase"
                style={{ backgroundColor: overlaySettings.accentColor }}
              >
                NEW GIVEAWAY
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Form: Create New Manifest */
        <div className="p-5 rounded-xl tactical-surface max-w-2xl">
          <div className="flex items-center space-x-3 mb-5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: overlaySettings.accentColor }}
            >
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase telemetry tracking-wider">
                Initialize Giveaway Manifest
              </h3>
              <p className="text-xs text-neutral-400">
                Configure your prize, title, and chat trigger command.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-[11px] telemetry uppercase text-neutral-400 mb-1 font-bold">
                Giveaway Title
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Championship Finals Knife Giveaway"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#11141e] border border-[#1e2436] text-white text-xs focus:outline-none focus:border-neutral-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] telemetry uppercase text-neutral-400 mb-1 font-bold">
                Prize Manifest
              </label>
              <div className="relative">
                <Gift className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={newPrize}
                  onChange={(e) => setNewPrize(e.target.value)}
                  placeholder="e.g. Karambit Doppler / $100 Steam Card"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#11141e] border border-[#1e2436] text-white text-xs focus:outline-none focus:border-neutral-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] telemetry uppercase text-neutral-400 mb-1 font-bold">
                Chat Trigger Keyword (Must begin with !)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="!join"
                  pattern="^![a-zA-Z0-9_-]+$"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#11141e] border border-[#1e2436] text-white text-xs telemetry focus:outline-none focus:border-neutral-400 transition-colors"
                />
              </div>
              <p className="text-[10px] telemetry text-neutral-400 mt-1">
                Viewers type this exact trigger in your Kick chat to enter.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-lg text-xs telemetry font-bold text-white shadow-sm hover:brightness-110 transition-all flex items-center justify-center space-x-2 mt-4 uppercase tracking-wider"
              style={{ backgroundColor: overlaySettings.accentColor }}
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'INITIALIZING...' : 'INITIALIZE MANIFEST'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
