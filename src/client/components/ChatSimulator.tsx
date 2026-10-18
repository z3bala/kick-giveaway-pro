import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Users,
  Copy,
  AlertCircle,
  Zap,
  Trash2,
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
}) => {
  const [username, setUsername] = useState('KickFan_99');
  const [message, setMessage] = useState(giveaway?.keyword || '!join');
  const [chatLogs, setChatLogs] = useState<Array<{ username: string; message: string; time: string; type: 'user' | 'system' }>>([
    {
      username: 'System',
      message: 'Chat simulator ready. Messages containing the keyword will enter viewers into the giveaway.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'user',
        },
      ]);
    } catch (err: any) {
      setChatLogs((prev) => [
        ...prev,
        {
          username: 'System Error',
          message: err.message,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'system',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const simulateBatch = async (count: number = 10) => {
    setIsSending(true);
    const adjectives = ['Apex', 'Viper', 'Ghost', 'Rogue', 'Titan', 'Shadow', 'Frost', 'Echo', 'Neon', 'Specter'];
    const nouns = ['Sniper', 'Knight', 'Shooter', 'Pilot', 'Striker', 'Phantom', 'Soldier', 'Gamer', 'Hunter', 'Blade'];
    const keyword = giveaway?.keyword || '!join';

    for (let i = 0; i < count; i++) {
      const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
      const noun = nouns[Math.floor(Math.random() * nouns.length)];
      const randomNum = Math.floor(Math.random() * 899) + 100;
      const fakeUsername = `${adj}_${noun}_${randomNum}`;

      try {
        await onSimulateChat(fakeUsername, keyword);
        setChatLogs((prev) => [
          ...prev,
          {
            username: fakeUsername,
            message: keyword,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'user',
          },
        ]);
        await new Promise((r) => setTimeout(r, 80));
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
        message: `Testing duplicate protection: @${dupUser} entering twice...`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'system',
      },
    ]);

    await onSimulateChat(dupUser, keyword);
    setChatLogs((prev) => [
      ...prev,
      {
        username: dupUser,
        message: keyword,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'user',
      },
    ]);

    await new Promise((r) => setTimeout(r, 300));

    await onSimulateChat(dupUser, keyword);
    setChatLogs((prev) => [
      ...prev,
      {
        username: dupUser,
        message: keyword,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'user',
      },
      {
        username: 'System',
        message: `Protected: @${dupUser}'s second entry was safely rejected by duplicate filter.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'system',
      },
    ]);
  };

  const simulateGtbGuess = async (amount: number) => {
    const fakeViewer = `StakeGuesser_${Math.floor(Math.random() * 899) + 100}`;
    const cmd = `!gtb ${amount}`;
    await onSimulateChat(fakeViewer, cmd);
    setChatLogs((prev) => [
      ...prev,
      {
        username: fakeViewer,
        message: cmd,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'user',
      },
    ]);
  };

  const simulateGtbBatch = async () => {
    const sampleGuesses = [120, 245, 260, 275, 310, 180, 255.5];
    for (const amt of sampleGuesses) {
      await simulateGtbGuess(amt);
      await new Promise((r) => setTimeout(r, 80));
    }
  };

  return (
    <div className="space-y-6 max-w-5xl pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Chat Simulator & Testing</h2>
        <p className="text-xs text-neutral-400 mt-1">
          Test viewer chat entry commands, check anti-duplicate filters, and simulate stream viewer activity.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl glass-card space-y-4">
            <h3 className="text-sm font-bold text-white">Send Test Message</h3>

            <form onSubmit={handleSend} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Viewer Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/[0.1] text-white text-xs focus:border-[#53fc18] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Message Content
                </label>
                <input
                  type="text"
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/[0.1] text-[#53fc18] font-mono text-xs focus:border-[#53fc18] focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="w-full py-2.5 rounded-xl bg-[#53fc18] hover:bg-[#45d914] text-black font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-[#53fc18]/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send to Chat</span>
              </button>
            </form>
          </div>

          {/* Quick Simulation Batch Presets */}
          <div className="p-5 rounded-2xl glass-card space-y-3">
            <h3 className="text-sm font-bold text-white">Quick Simulation Presets</h3>

            <button
              onClick={() => simulateBatch(10)}
              disabled={isSending || giveaway?.status !== 'open'}
              className="w-full py-2.5 px-3.5 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-neutral-200 hover:text-white flex items-center justify-between transition-all"
            >
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#53fc18]" />
                <span>Simulate 10 Viewers</span>
              </div>
              <span className="text-[11px] font-mono text-neutral-400">+10</span>
            </button>

            <button
              onClick={() => simulateBatch(25)}
              disabled={isSending || giveaway?.status !== 'open'}
              className="w-full py-2.5 px-3.5 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-neutral-200 hover:text-white flex items-center justify-between transition-all"
            >
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Stress Test 25 Viewers</span>
              </div>
              <span className="text-[11px] font-mono text-neutral-400">+25</span>
            </button>

            <button
              onClick={simulateDuplicate}
              disabled={isSending || giveaway?.status !== 'open'}
              className="w-full py-2.5 px-3.5 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-neutral-200 hover:text-white flex items-center justify-between transition-all"
            >
              <div className="flex items-center space-x-2">
                <Copy className="w-4 h-4 text-purple-400" />
                <span>Test Duplicate Protection</span>
              </div>
              <span className="text-[11px] font-mono text-neutral-400">Filter</span>
            </button>

            {/* GTB Simulation Buttons */}
            <div className="pt-2 border-t border-white/[0.08] space-y-2">
              <div className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider flex items-center space-x-1.5">
                <span>🎰</span>
                <span>Guess The Balance (Stake.com)</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => simulateGtbGuess(260)}
                  disabled={isSending}
                  className="py-2 px-2.5 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:text-white flex items-center justify-center space-x-1 transition-all cursor-pointer"
                >
                  <span>!gtb 260</span>
                </button>

                <button
                  type="button"
                  onClick={simulateGtbBatch}
                  disabled={isSending}
                  className="py-2 px-2.5 rounded-xl text-xs font-semibold bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:text-white flex items-center justify-center space-x-1 transition-all cursor-pointer"
                >
                  <span>Batch 7 Guesses</span>
                </button>
              </div>
            </div>

            {giveaway?.status !== 'open' && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center space-x-2 mt-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Giveaway must be open to accept giveaway keyword entries.</span>
              </div>
            )}
          </div>
        </div>

        {/* Live Chat Log Feed */}
        <div className="lg:col-span-2 p-5 rounded-2xl glass-card flex flex-col h-[500px]">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-[#53fc18]" />
              <span className="text-sm font-bold text-white">Stream Chat Feed</span>
            </div>
            <button
              onClick={() => setChatLogs([])}
              className="text-xs text-neutral-400 hover:text-white flex items-center space-x-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {chatLogs.map((log, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl border transition-all ${
                  log.type === 'system'
                    ? 'bg-white/[0.02] border-white/[0.05] text-neutral-400 text-xs'
                    : 'bg-black/30 border-white/[0.06] text-neutral-200'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className={`font-semibold ${log.type === 'system' ? 'text-amber-400' : 'text-[#53fc18]'}`}>
                    {log.type === 'system' ? log.username : `@${log.username}`}
                  </span>
                  <span className="text-neutral-500 text-[10px]">{log.time}</span>
                </div>
                <div className="text-xs break-words text-white font-medium">{log.message}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
