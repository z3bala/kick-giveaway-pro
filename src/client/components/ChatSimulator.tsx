import React, { useState } from 'react';
import {
  Terminal,
  Send,
  Users,
  Copy,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import type { Giveaway } from '../../shared/types.js';

interface ChatSimulatorProps {
  giveaway: Giveaway | null;
  onSimulateChat: (username: string, message: string) => Promise<void>;
  accentColor?: string;
}

export const ChatSimulator: React.FC<ChatSimulatorProps> = ({
  giveaway,
  onSimulateChat,
  accentColor = '#e11d48',
}) => {
  const [username, setUsername] = useState('KickViewer_42');
  const [message, setMessage] = useState(giveaway?.keyword || '!join');
  const [chatLogs, setChatLogs] = useState<Array<{ username: string; message: string; time: string; type: 'user' | 'bot' | 'system' }>>([
    {
      username: 'System',
      message: 'Chat simulator ready. Messages will trigger the bot logic and register giveaway entries.',
      time: new Date().toLocaleTimeString(),
      type: 'system',
    },
  ]);
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim() || !message.trim()) return;

    setIsSending(true);
    const sentUser = username.trim();
    const sentMsg = message.trim();

    try {
      await onSimulateChat(sentUser, sentMsg);
      setChatLogs((prev) => [
        ...prev,
        {
          username: sentUser,
          message: sentMsg,
          time: new Date().toLocaleTimeString(),
          type: 'user',
        },
      ]);
    } catch (err: any) {
      setChatLogs((prev) => [
        ...prev,
        {
          username: 'Error',
          message: err.message,
          time: new Date().toLocaleTimeString(),
          type: 'system',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const simulateBatch = async (count: number = 10) => {
    setIsSending(true);
    const randomAdjectives = ['Super', 'Epic', 'Turbo', 'Shadow', 'Mystic', 'Golden', 'Dark', 'Hyper', 'Crazy', 'Silent'];
    const randomNouns = ['Gamer', 'KickFan', 'Sniper', 'Streamer', 'Viper', 'Knight', 'Wizard', 'Ninja', 'Player', 'Beast'];

    const keyword = giveaway?.keyword || '!join';

    for (let i = 0; i < count; i++) {
      const adj = randomAdjectives[Math.floor(Math.random() * randomAdjectives.length)];
      const noun = randomNouns[Math.floor(Math.random() * randomNouns.length)];
      const randomNum = Math.floor(Math.random() * 899) + 100;
      const fakeUsername = `${adj}${noun}_${randomNum}`;

      try {
        await onSimulateChat(fakeUsername, keyword);
        setChatLogs((prev) => [
          ...prev,
          {
            username: fakeUsername,
            message: keyword,
            time: new Date().toLocaleTimeString(),
            type: 'user',
          },
        ]);
        // slight stagger
        await new Promise((r) => setTimeout(r, 120));
      } catch {}
    }
    setIsSending(false);
  };

  const simulateDuplicate = async () => {
    const dupUser = 'DuplicateTester_99';
    const keyword = giveaway?.keyword || '!join';

    setChatLogs((prev) => [
      ...prev,
      {
        username: 'System',
        message: `Simulating user @${dupUser} sending entry keyword twice to test duplicate prevention...`,
        time: new Date().toLocaleTimeString(),
        type: 'system',
      },
    ]);

    await onSimulateChat(dupUser, keyword);
    setChatLogs((prev) => [
      ...prev,
      {
        username: dupUser,
        message: keyword,
        time: new Date().toLocaleTimeString(),
        type: 'user',
      },
    ]);

    await new Promise((r) => setTimeout(r, 500));

    await onSimulateChat(dupUser, keyword);
    setChatLogs((prev) => [
      ...prev,
      {
        username: dupUser,
        message: keyword,
        time: new Date().toLocaleTimeString(),
        type: 'user',
      },
      {
        username: 'System',
        message: `Verified: @${dupUser} was rejected on second entry by SQLite UNIQUE constraint. Participant count unchanged.`,
        time: new Date().toLocaleTimeString(),
        type: 'system',
      },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Chat Simulator & Rehearsal Tool</h2>
        <p className="text-sm text-neutral-400">
          Simulate incoming Kick chat messages, test bot keyword parsing, and verify duplicate protection without live streaming.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input Form & Quick Batches */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-6 rounded-2xl bg-brand-surface border border-brand-border space-y-4">
            <h3 className="text-xs font-mono uppercase text-neutral-400 font-bold">
              Simulate Viewer Message
            </h3>

            <form onSubmit={handleSend} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                  Viewer Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-brand-surface2 border border-brand-border text-white text-xs font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                  Chat Message (Entry command)
                </label>
                <input
                  type="text"
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-brand-surface2 border border-brand-border text-white text-xs font-mono focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center justify-center space-x-2 transition-all hover:brightness-110"
                style={{ backgroundColor: accentColor }}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Chat Message</span>
              </button>
            </form>
          </div>

          {/* Quick Simulation Presets */}
          <div className="p-6 rounded-2xl bg-brand-surface border border-brand-border space-y-3">
            <h3 className="text-xs font-mono uppercase text-neutral-400 font-bold">
              Automated Rehearsal Actions
            </h3>

            <button
              onClick={() => simulateBatch(10)}
              disabled={isSending || giveaway?.status !== 'open'}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold bg-brand-surface2 hover:bg-brand-surface3 border border-brand-border text-neutral-200 hover:text-white flex items-center justify-between transition-all"
            >
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Batch 10 Entrants</span>
              </div>
              <span className="text-[10px] font-mono bg-brand-surface3 px-2 py-0.5 rounded text-neutral-400">
                +10 Viewers
              </span>
            </button>

            <button
              onClick={() => simulateBatch(25)}
              disabled={isSending || giveaway?.status !== 'open'}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold bg-brand-surface2 hover:bg-brand-surface3 border border-brand-border text-neutral-200 hover:text-white flex items-center justify-between transition-all"
            >
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Batch 25 Entrants (Stress Test)</span>
              </div>
              <span className="text-[10px] font-mono bg-brand-surface3 px-2 py-0.5 rounded text-neutral-400">
                +25 Viewers
              </span>
            </button>

            <button
              onClick={simulateDuplicate}
              disabled={isSending || giveaway?.status !== 'open'}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold bg-brand-surface2 hover:bg-brand-surface3 border border-brand-border text-neutral-200 hover:text-white flex items-center justify-between transition-all"
            >
              <div className="flex items-center space-x-2">
                <Copy className="w-4 h-4 text-rose-400" />
                <span>Test Duplicate Rejection</span>
              </div>
              <span className="text-[10px] font-mono bg-brand-surface3 px-2 py-0.5 rounded text-neutral-400">
                Verify Fix
              </span>
            </button>

            {giveaway?.status !== 'open' && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Giveaway must be Open to accept entries.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Chat Terminal Output */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-brand-surface border border-brand-border flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-3 border-b border-brand-border mb-3">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-neutral-400" />
              <span className="text-xs font-mono uppercase text-neutral-300 font-bold">
                Live Channel Chat Feed
              </span>
            </div>
            <button
              onClick={() => setChatLogs([])}
              className="text-[11px] font-mono text-neutral-500 hover:text-neutral-300"
            >
              Clear Log
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2 font-mono text-xs">
            {chatLogs.map((log, i) => (
              <div
                key={i}
                className={`p-2.5 rounded-xl border ${
                  log.type === 'system'
                    ? 'bg-brand-surface2/60 border-brand-border text-neutral-400 text-[11px]'
                    : 'bg-brand-surface2 border-brand-border text-neutral-200'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-neutral-500 mb-0.5">
                  <span className="font-bold text-neutral-300">
                    {log.type === 'system' ? '⚙️ System' : `@${log.username}`}
                  </span>
                  <span>{log.time}</span>
                </div>
                <div className="break-words font-sans">{log.message}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
