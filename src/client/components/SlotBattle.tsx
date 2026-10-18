import React, { useState, useEffect } from 'react';
import {
  Swords,
  Trophy,
  Users,
  Shuffle,
  Lock,
  RotateCcw,
  Volume2,
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
  Play,
  Crown,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Send,
  HelpCircle,
} from 'lucide-react';
import { api } from '../utils/api.js';
import type { SlotTournament, SlotMatch } from '../../shared/types.js';

interface SlotBattleProps {
  tournament: SlotTournament | null;
  overlayToken?: string;
  onOpenAuthModal?: () => void;
  isAdminAuthenticated?: boolean;
}

export const SlotBattle: React.FC<SlotBattleProps> = ({
  tournament,
  overlayToken,
  onOpenAuthModal,
  isAdminAuthenticated,
}) => {
  // Setup form states
  const [slotNameInput, setSlotNameInput] = useState('Gates of Olympus');
  const [sizeInput, setSizeInput] = useState<8 | 16>(8);
  const [participantsInput, setParticipantsInput] = useState<string[]>(Array(8).fill(''));
  const [bulkTextInput, setBulkTextInput] = useState('');
  const [showBulkPaste, setShowBulkPaste] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedOverlay, setCopiedOverlay] = useState(false);

  // Invalidation confirmation modal
  const [confirmModalData, setConfirmModalData] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    affectedMatches?: string[];
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: async () => {},
  });

  // Sync setup inputs with active tournament when in setup
  useEffect(() => {
    if (tournament && tournament.status === 'setup') {
      setSlotNameInput(tournament.slotName || 'Gates of Olympus');
      setSizeInput(tournament.size || 8);
      const parts = [...(tournament.participants || [])];
      while (parts.length < tournament.size) parts.push('');
      setParticipantsInput(parts.slice(0, tournament.size));
    }
  }, [tournament]);

  // Handle participant single input change
  const handleParticipantChange = (index: number, value: string) => {
    const updated = [...participantsInput];
    updated[index] = value;
    setParticipantsInput(updated);
    setErrorMessage(null);
  };

  // Save participant changes to server
  const handleSaveParticipants = async (updatedList?: string[]) => {
    const listToSave = updatedList || participantsInput;
    try {
      setIsSubmitting(true);
      await api.updateTournamentParticipants(listToSave);
      setSuccessMessage('Player list updated.');
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Switch size 8 <-> 16
  const handleSizeChange = async (newSize: 8 | 16) => {
    setSizeInput(newSize);
    let newParts = [...participantsInput];
    if (newSize === 16) {
      while (newParts.length < 16) newParts.push('');
    } else {
      newParts = newParts.slice(0, 8);
    }
    setParticipantsInput(newParts);

    if (tournament && tournament.status === 'setup') {
      try {
        setIsSubmitting(true);
        await api.updateTournamentSize(newSize);
      } catch (err: any) {
        setErrorMessage(err.message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Quick fill with stream-ready test names
  const handleQuickFill = () => {
    const sampleNames = [
      'Ahmed', 'Mohamed', 'Karim', 'Sami', 'Omar', 'Youssef', 'Tariq', 'Zaid',
      'Hamza', 'Bilal', 'Mustafa', 'Khalid', 'Faris', 'Nader', 'Rami', 'Adel'
    ];
    const filled = sampleNames.slice(0, sizeInput);
    setParticipantsInput(filled);
    if (tournament && tournament.status === 'setup') {
      handleSaveParticipants(filled);
    }
  };

  // Parse bulk paste text
  const handleApplyBulkText = () => {
    const lines = bulkTextInput
      .split(/[\n,]+/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const updated = [...lines];
    while (updated.length < sizeInput) {
      updated.push('');
    }
    const finalSelection = updated.slice(0, sizeInput);
    setParticipantsInput(finalSelection);
    setShowBulkPaste(false);
    setBulkTextInput('');
    if (tournament && tournament.status === 'setup') {
      handleSaveParticipants(finalSelection);
    }
  };

  // Shuffle positions
  const handleShuffle = async () => {
    try {
      setIsSubmitting(true);
      const res = await api.shuffleTournamentParticipants();
      setParticipantsInput(res.participants);
      setSuccessMessage('Player positions shuffled randomly!');
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create new tournament from dashboard
  const handleCreateTournament = async () => {
    if (!slotNameInput.trim()) {
      setErrorMessage('Please enter a slot name.');
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await api.createTournament({ slotName: slotNameInput.trim(), size: sizeInput });
      setSuccessMessage(`Tournament created for "${slotNameInput.trim()}"!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lock bracket & start tournament
  const handleLockBracket = async () => {
    setErrorMessage(null);
    try {
      setIsSubmitting(true);
      // Auto save participants first if needed
      await api.updateTournamentParticipants(participantsInput);
      await api.lockTournamentBracket();
      setSuccessMessage('Bracket locked! Match 1 has begun and announced to Kick chat.');
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Select Winner with downstream confirmation
  const handleSelectWinner = async (matchId: string, winnerName: string, force: boolean = false) => {
    try {
      setIsSubmitting(true);
      const result = await api.selectMatchWinner(matchId, winnerName, force);

      if (result.requiresConfirmation && result.affectedMatches) {
        setConfirmModalData({
          isOpen: true,
          title: 'Correct Match Winner?',
          message: `Changing the winner of this match to "${winnerName}" will invalidate already completed downstream matches. The bracket progression for those matches will be cleared and recalculated.`,
          affectedMatches: result.affectedMatches,
          onConfirm: async () => {
            await handleSelectWinner(matchId, winnerName, true);
            setConfirmModalData((prev) => ({ ...prev, isOpen: false }));
          },
        });
        return;
      }

      setSuccessMessage(`Winner recorded: @${winnerName}`);
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Re-announce current matchup
  const handleReannounce = async () => {
    try {
      const match = await api.announceCurrentMatch();
      if (match) {
        setSuccessMessage(`Matchup re-sent to Kick chat: ${match.player1Name} vs ${match.player2Name}`);
      } else {
        setSuccessMessage('Matchup announced in Kick chat!');
      }
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // Reset tournament with confirmation
  const handleResetTournament = () => {
    setConfirmModalData({
      isOpen: true,
      title: 'Reset Slot Battle Tournament',
      message: 'Are you sure you want to cancel and reset the active Slot Battle? The current bracket results will be archived.',
      onConfirm: async () => {
        await api.resetTournament();
        setConfirmModalData((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Copy OBS Overlay URL
  const overlayUrl = `${window.location.origin}/overlay/slot-tournament${overlayToken ? `?token=${encodeURIComponent(overlayToken)}` : ''}`;
  const handleCopyOverlay = () => {
    navigator.clipboard.writeText(overlayUrl);
    setCopiedOverlay(true);
    setTimeout(() => setCopiedOverlay(false), 2000);
  };

  // Group matches by round for bracket rendering
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

  // Find active / current match
  const activeMatch = tournament?.matches.find((m) => m.id === tournament?.currentMatchId) ||
    tournament?.matches.find((m) => m.status === 'ready');

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Banner / Header Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#121624] via-[#0d101b] to-[#080a12] border border-white/[0.08] p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <span className="p-2 rounded-xl bg-gradient-to-tr from-[#53fc18] to-emerald-400 text-black shadow-lg shadow-emerald-500/20">
                <Swords className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Slot Battle Tournament
                {tournament && (
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider border ${
                      tournament.status === 'in_progress'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
                        : tournament.status === 'completed'
                        ? 'bg-[#53fc18]/20 text-[#53fc18] border-[#53fc18]/40'
                        : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                    }`}
                  >
                    {tournament.status === 'in_progress'
                      ? 'Live Tournament'
                      : tournament.status === 'completed'
                      ? 'Completed'
                      : 'Setup Mode'}
                  </span>
                )}
              </h1>
            </div>
            <p className="text-sm text-neutral-400 max-w-2xl">
              Run live 8 or 16-player single-elimination slot battles. Control winners manually from your dashboard with instant OBS overlay updates and automatic Kick chat announcements.
            </p>
          </div>

          {/* Quick Actions Header Toolbar */}
          <div className="flex items-center space-x-2.5 self-stretch md:self-auto">
            <button
              onClick={handleCopyOverlay}
              className={`flex-1 md:flex-none flex items-center justify-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                copiedOverlay
                  ? 'bg-[#53fc18] text-black border-[#53fc18]'
                  : 'bg-white/[0.05] hover:bg-white/[0.1] text-white border-white/[0.1]'
              }`}
              title="Copy OBS Browser Source URL"
            >
              {copiedOverlay ? <Check className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4 text-emerald-400" />}
              <span>{copiedOverlay ? 'Copied OBS Link!' : 'OBS Overlay Link'}</span>
            </button>

            <a
              href={overlayUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 hover:text-white border border-white/[0.1] transition-colors"
              title="Preview OBS Overlay in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {tournament && (
              <button
                onClick={handleResetTournament}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                title="Reset or Cancel Tournament"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error & Success Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm flex items-center space-x-2 animate-shake">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-4 rounded-xl bg-[#53fc18]/15 border border-[#53fc18]/30 text-emerald-300 text-sm flex items-center space-x-2">
          <Sparkles className="w-4 h-4 shrink-0 text-[#53fc18]" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* State A: No Tournament currently active */}
      {!tournament && (
        <div className="rounded-2xl bg-[#0f131f] border border-white/[0.08] p-8 text-center space-y-6 max-w-2xl mx-auto shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#53fc18]/20 to-emerald-500/20 border border-[#53fc18]/30 flex items-center justify-center mx-auto text-[#53fc18]">
            <Swords className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Start a New Slot Battle</h2>
            <p className="text-sm text-neutral-400 max-w-md mx-auto">
              Type <code className="px-2 py-0.5 rounded bg-white/[0.08] text-[#53fc18] font-mono text-xs">!Pslot [slot name]</code> in your Kick stream chat, or create one right here.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                value={slotNameInput}
                onChange={(e) => setSlotNameInput(e.target.value)}
                placeholder="e.g. Gates of Olympus, Sweet Bonanza..."
                className="flex-1 w-full bg-[#161c2d] border border-white/[0.12] rounded-xl px-4 py-3 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#53fc18] transition-colors"
              />
              <div className="flex items-center gap-1.5 bg-[#161c2d] p-1 rounded-xl border border-white/[0.08] shrink-0">
                <button
                  type="button"
                  onClick={() => setSizeInput(8)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    sizeInput === 8
                      ? 'bg-[#53fc18] text-black shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  8 Players
                </button>
                <button
                  type="button"
                  onClick={() => setSizeInput(16)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    sizeInput === 16
                      ? 'bg-[#53fc18] text-black shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  16 Players
                </button>
              </div>
            </div>

            <button
              onClick={handleCreateTournament}
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#53fc18] to-emerald-500 hover:from-[#49e215] hover:to-emerald-400 text-black font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Swords className="w-4 h-4" />
              <span>Create Slot Battle Tournament</span>
            </button>
          </div>
        </div>
      )}

      {/* State B: Tournament in Setup Mode */}
      {tournament && tournament.status === 'setup' && (
        <div className="space-y-6">
          {/* Setup Configuration Panel */}
          <div className="rounded-2xl bg-[#0f131f] border border-white/[0.08] p-6 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Step 1 — Setup Bracket</span>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  Slot: <span className="text-amber-400 font-mono">"{tournament.slotName}"</span>
                </h2>
              </div>

              {/* Bracket Format Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">Tournament Size:</span>
                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/[0.08]">
                  <button
                    onClick={() => handleSizeChange(8)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      sizeInput === 8
                        ? 'bg-[#53fc18] text-black shadow'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    8 Players
                  </button>
                  <button
                    onClick={() => handleSizeChange(16)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      sizeInput === 16
                        ? 'bg-[#53fc18] text-black shadow'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    16 Players
                  </button>
                </div>
              </div>
            </div>

            {/* Participant Entry List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-[#53fc18]" />
                  <span className="text-sm font-semibold text-white">
                    Participants ({participantsInput.filter((p) => p.trim()).length} / {sizeInput})
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleQuickFill}
                    className="px-2.5 py-1 text-xs rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 hover:text-white border border-white/[0.08] transition-colors"
                  >
                    Auto Fill Test Names
                  </button>
                  <button
                    onClick={() => setShowBulkPaste(!showBulkPaste)}
                    className="px-2.5 py-1 text-xs rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 hover:text-white border border-white/[0.08] transition-colors"
                  >
                    {showBulkPaste ? 'Hide Bulk Paste' : 'Bulk Paste Names'}
                  </button>
                  <button
                    onClick={handleShuffle}
                    disabled={isSubmitting}
                    className="flex items-center space-x-1.5 px-3 py-1 text-xs rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-colors"
                  >
                    <Shuffle className="w-3 h-3" />
                    <span>Shuffle Positions</span>
                  </button>
                </div>
              </div>

              {/* Bulk Paste Box */}
              {showBulkPaste && (
                <div className="p-4 rounded-xl bg-black/40 border border-white/[0.08] space-y-3 animate-fade-in">
                  <label className="text-xs text-neutral-400">
                    Paste participant names (one per line or comma-separated):
                  </label>
                  <textarea
                    rows={4}
                    value={bulkTextInput}
                    onChange={(e) => setBulkTextInput(e.target.value)}
                    placeholder="Ahmed&#10;Mohamed&#10;Karim&#10;Sami..."
                    className="w-full bg-[#161c2d] border border-white/[0.12] rounded-xl p-3 text-white text-xs font-mono placeholder:text-neutral-600 focus:outline-none focus:border-[#53fc18]"
                  />
                  <button
                    onClick={handleApplyBulkText}
                    className="px-4 py-1.5 rounded-lg bg-[#53fc18] text-black text-xs font-bold hover:bg-[#45de13] transition-colors"
                  >
                    Apply Names
                  </button>
                </div>
              )}

              {/* Seed Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {participantsInput.slice(0, sizeInput).map((name, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-2 bg-[#141927] border border-white/[0.08] rounded-xl p-2.5 focus-within:border-[#53fc18] transition-colors"
                  >
                    <span className="w-6 h-6 rounded-lg bg-white/[0.05] text-[11px] font-mono text-neutral-400 flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => handleParticipantChange(idx, e.target.value)}
                      onBlur={() => handleSaveParticipants()}
                      placeholder={`Player ${idx + 1}`}
                      className="w-full bg-transparent text-sm text-white focus:outline-none placeholder:text-neutral-600 font-medium"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Lock & Start Button */}
            <div className="pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-neutral-400 flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-neutral-500 shrink-0" />
                <span>
                  Confirming locks player names and prepares the bracket for matches.
                </span>
              </div>

              <button
                onClick={handleLockBracket}
                disabled={isSubmitting || participantsInput.filter((p) => p.trim()).length !== sizeInput}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#53fc18] to-emerald-400 text-black font-bold text-sm shadow-lg shadow-emerald-500/20 hover:from-[#47e012] hover:to-emerald-300 transition-all flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Lock className="w-4 h-4" />
                <span>Lock Bracket & Start Matches</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* State C: Tournament In Progress or Completed */}
      {tournament && (tournament.status === 'in_progress' || tournament.status === 'completed') && (
        <div className="space-y-6">
          {/* Active Match Spotlight Card (When In Progress) */}
          {tournament.status === 'in_progress' && activeMatch && (
            <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#131929] to-amber-500/5 border border-amber-500/30 p-6 shadow-xl relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-1 text-center md:text-left">
                  <span className="text-[11px] font-bold tracking-wider uppercase text-amber-400 flex items-center justify-center md:justify-start gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    Now Playing • {activeMatch.roundName}
                  </span>
                  <h3 className="text-2xl font-extrabold text-white">
                    {activeMatch.player1Name || 'TBD'} <span className="text-neutral-500 font-normal">vs</span> {activeMatch.player2Name || 'TBD'}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Watch the battle on stream, then click the winning player below to advance them.
                  </p>
                </div>

                {/* Direct Winner Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => activeMatch.player1Name && handleSelectWinner(activeMatch.id, activeMatch.player1Name)}
                    disabled={!activeMatch.player1Name || !activeMatch.player2Name || isSubmitting}
                    className="px-5 py-3 rounded-xl bg-[#53fc18] hover:bg-[#48e014] text-black font-extrabold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Crown className="w-4 h-4" />
                    <span>{activeMatch.player1Name || 'Player 1'} Wins</span>
                  </button>

                  <button
                    onClick={() => activeMatch.player2Name && handleSelectWinner(activeMatch.id, activeMatch.player2Name)}
                    disabled={!activeMatch.player1Name || !activeMatch.player2Name || isSubmitting}
                    className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Crown className="w-4 h-4" />
                    <span>{activeMatch.player2Name || 'Player 2'} Wins</span>
                  </button>

                  <button
                    onClick={handleReannounce}
                    className="p-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-neutral-200 hover:text-white border border-white/[0.1] transition-colors"
                    title="Re-send this matchup to Kick chat"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Champion Celebration Banner (When Completed) */}
          {tournament.status === 'completed' && tournament.champion && (
            <div className="rounded-2xl bg-gradient-to-r from-yellow-500/20 via-[#181d11] to-emerald-500/20 border border-yellow-500/40 p-8 text-center space-y-4 shadow-2xl relative overflow-hidden animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-400 to-amber-500 text-black flex items-center justify-center mx-auto shadow-2xl shadow-yellow-500/40">
                <Trophy className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold tracking-widest text-yellow-400 uppercase">
                  Slot Battle Champion
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white">
                  👑 {tournament.champion}
                </h2>
                <p className="text-sm text-neutral-300">
                  Winner of the <span className="text-amber-300 font-semibold">{tournament.slotName}</span> tournament!
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={handleResetTournament}
                  className="px-6 py-2.5 rounded-xl bg-[#53fc18] hover:bg-[#43d911] text-black font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all"
                >
                  Start New Tournament
                </button>
              </div>
            </div>
          )}

          {/* Interactive Tournament Bracket Visualization */}
          <div className="rounded-2xl bg-[#0b0e17] border border-white/[0.08] p-6 shadow-2xl space-y-6 overflow-x-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center space-x-2.5">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Tournament Bracket</h3>
              </div>

              <div className="flex items-center space-x-3 text-xs text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  Winner
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  Live Match
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-neutral-600" />
                  Eliminated
                </span>
              </div>
            </div>

            {/* Visual Round Columns with Connector Flow */}
            <div className="flex items-stretch gap-8 min-w-[760px] py-4">
              {rounds.map((round, rIdx) => (
                <div key={round.index} className="flex-1 flex flex-col space-y-4">
                  {/* Round Header */}
                  <div className="text-center pb-2 border-b border-white/[0.08]">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-300">
                      {round.name}
                    </span>
                    <span className="block text-[11px] text-neutral-500">
                      {round.matches.length} {round.matches.length === 1 ? 'Match' : 'Matches'}
                    </span>
                  </div>

                  {/* Matches Column */}
                  <div className="flex-1 flex flex-col justify-around space-y-6">
                    {round.matches.map((match, mIdx) => {
                      const isCurrent = tournament.currentMatchId === match.id && match.status !== 'completed';
                      const isReady = match.status === 'ready';
                      const isDone = match.status === 'completed';

                      return (
                        <div
                          key={match.id}
                          className={`relative rounded-xl border p-3.5 transition-all ${
                            isCurrent
                              ? 'bg-[#151c2d] border-amber-400/80 shadow-lg shadow-amber-500/10 ring-2 ring-amber-400/30'
                              : isDone
                              ? 'bg-[#0f131f] border-white/[0.08]'
                              : isReady
                              ? 'bg-[#121626] border-white/[0.14]'
                              : 'bg-white/[0.02] border-white/[0.04] opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono text-neutral-500 uppercase">
                              Match {mIdx + 1}
                            </span>
                            {isDone ? (
                              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                                Done
                              </span>
                            ) : isCurrent ? (
                              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider animate-pulse">
                                Live
                              </span>
                            ) : null}
                          </div>

                          {/* Player 1 Card */}
                          <div
                            onClick={() => {
                              if (match.player1Name && match.player2Name && tournament.status === 'in_progress') {
                                handleSelectWinner(match.id, match.player1Name);
                              }
                            }}
                            className={`flex items-center justify-between p-2 rounded-lg mb-1.5 cursor-pointer transition-all ${
                              match.winnerName === match.player1Name && match.player1Name
                                ? 'bg-[#53fc18]/20 border border-[#53fc18]/50 text-white font-bold'
                                : match.winnerName && match.winnerName !== match.player1Name
                                ? 'opacity-40 text-neutral-400 line-through'
                                : 'bg-white/[0.03] hover:bg-white/[0.08] text-neutral-200'
                            }`}
                          >
                            <span className="text-xs truncate max-w-[130px]">
                              {match.player1Name || <span className="italic text-neutral-600">Waiting...</span>}
                            </span>
                            {match.winnerName === match.player1Name && match.player1Name && (
                              <Crown className="w-3.5 h-3.5 text-[#53fc18] shrink-0" />
                            )}
                          </div>

                          {/* Player 2 Card */}
                          <div
                            onClick={() => {
                              if (match.player1Name && match.player2Name && tournament.status === 'in_progress') {
                                handleSelectWinner(match.id, match.player2Name);
                              }
                            }}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                              match.winnerName === match.player2Name && match.player2Name
                                ? 'bg-[#53fc18]/20 border border-[#53fc18]/50 text-white font-bold'
                                : match.winnerName && match.winnerName !== match.player2Name
                                ? 'opacity-40 text-neutral-400 line-through'
                                : 'bg-white/[0.03] hover:bg-white/[0.08] text-neutral-200'
                            }`}
                          >
                            <span className="text-xs truncate max-w-[130px]">
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
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Downstream Invalidation / Reset Confirmation Modal */}
      {confirmModalData.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#131724] border border-white/[0.12] p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-white">{confirmModalData.title}</h3>
              <p className="text-sm text-neutral-300 leading-relaxed">{confirmModalData.message}</p>
            </div>

            {confirmModalData.affectedMatches && confirmModalData.affectedMatches.length > 0 && (
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08] space-y-1">
                <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">
                  Affected Downstream Matches:
                </span>
                <ul className="text-xs text-neutral-300 list-disc list-inside space-y-0.5">
                  {confirmModalData.affectedMatches.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalData((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-white/[0.05] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModalData.onConfirm}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-black shadow-lg shadow-amber-500/20 transition-colors"
              >
                Proceed & Invalidate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
