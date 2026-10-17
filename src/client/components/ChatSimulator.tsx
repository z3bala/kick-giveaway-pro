import React, { useState } from 'react';
import {
  Terminal,
  Send,
  Users,
  Copy,
  AlertCircle,
  Crosshair,
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
  accentColor = '#e63946',
}) => {
  const [username, setUsername] = useState('KickFan_99');
  const [message, setMessage] = useState(giveaway?.keyword || '!join');
  const [chatLogs, setChatLogs] = useState<Array<{ username: string; message: string; time: string; type: 'user' | 'system' }>>([
    {
      username: 'SYSTEM',
      message: 'TERMINAL READY // INBOUND CHAT MESSAGES WILL TRIGGER THE ENTRY EVALUATION ENGINE.',
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
          username: 'ERROR',
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
            time: new Date().toLocaleTimeString(),
            type: 'user',
          },
        ]);
        await new Promise((r) => setTimeout(r, 100));
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
        username: 'SYSTEM',
        message: `TESTING DUPLICATE FILTER // USER @${dupUser} SENDING DUAL ENTRY PACKETS...`,
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

    await new Promise((r) => setTimeout(r, 400));

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
        username: 'SYSTEM',
        message: `VERIFIED: @${dupUser} SECOND ENTRY REJECTED BY DATABASE UNIQUE CONSTRAINT.`,
        time: new Date().toLocaleTimeString(),
        type: 'system',
      },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-[#1b1f2e]">
        <h2 className="text-xl font-black text-white tracking-wider uppercase telemetry">
          Inbound Chat Terminal
        </h2>
        <p className="text-xs text-neutral-400 mt-0.5">
          Simulate Kick chat traffic, test keyword parsers, and verify duplicate filters offline.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Form & Presets */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-4 rounded-xl tactical-surface space-y-3.5">
            <h3 className="text-xs telemetry uppercase text-neutral-300 font-bold tracking-wider">
              Inject Chat Packet
            </h3>

            <form onSubmit={handleSend} className="space-y-3">
              <div>
                <label className="block text-[10px] telemetry uppercase text-neutral-400 mb-1">
                  Viewer Handle
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#11141e] border border-[#1e2436] text-white text-xs telemetry focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] telemetry uppercase text-neutral-400 mb-1">
                  Message Payload
                </label>
                <input
                  type="text"
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#11141e] border border-[#1e2436] text-white text-xs telemetry focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="w-full py-2 rounded-lg text-xs telemetry font-bold text-white shadow-sm flex items-center justify-center space-x-1.5 transition-all hover:brightness-110 uppercase tracking-wider"
                style={{ backgroundColor: accentColor }}
              >
                <Send className="w-3.5 h-3.5" />
                <span>INJECT PACKET</span>
              </button>
            </form>
          </div>

          {/* Quick Presets */}
          <div className="p-4 rounded-xl tactical-surface space-y-2.5">
            <h3 className="text-xs telemetry uppercase text-neutral-300 font-bold tracking-wider">
              Stress Test Presets
            </h3>

            <button
              onClick={() => simulateBatch(10)}
              disabled={isSending || giveaway?.status !== 'open'}
              className="w-full py-2 px-3 rounded-lg text-xs telemetry font-bold bg-[#11141e] hover:bg-[#181d2a] border border-[#1e2436] text-neutral-200 hover:text-white flex items-center justify-between transition-all"
            >
              <div className="flex items-center space-x-2">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>INJECT 10 VIEWERS</span>
              </div>
              <span className="text-[10px] bg-[#1a1f2e] px-1.5 py-0.5 rounded text-neutral-400">
                +10
              </span>
            </button>

            <button
              onClick={() => simulateBatch(25)}
              disabled={isSending || giveaway?.status !== 'open'}
              className="w-full py-2 px-3 rounded-lg text-xs telemetry font-bold bg-[#11141e] hover:bg-[#181d2a] border border-[#1e2436] text-neutral-200 hover:text-white flex items-center justify-between transition-all"
            >
              <div className="flex items-center space-x-2">
                <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                <span>STRESS TEST 25 VIEWERS</span>
              </div>
              <span className="text-[10px] bg-[#1a1f2e] px-1.5 py-0.5 rounded text-neutral-400">
                +25
              </span>
            </button>

            <button
              onClick={simulateDuplicate}
              disabled={isSending || giveaway?.status !== 'open'}
              className="w-full py-2 px-3 rounded-lg text-xs telemetry font-bold bg-[#11141e] hover:bg-[#181d2a] border border-[#1e2436] text-neutral-200 hover:text-white flex items-center justify-between transition-all"
            >
              <div className="flex items-center space-x-2">
                <Copy className="w-3.5 h-3.5 text-rose-400" />
                <span>VERIFY DUPLICATE FILTER</span>
              </div>
              <span className="text-[10px] bg-[#1a1f2e] px-1.5 py-0.5 rounded text-neutral-400">
                TEST
              </span>
            </button>

            {giveaway?.status !== 'open' && (
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] telemetry flex items-center space-x-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>GIVEAWAY MUST BE OPEN TO REGISTER ENTRANTS.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Terminal Logs */}
        <div className="lg:col-span-2 p-4 rounded-xl tactical-surface flex flex-col h-[480px]">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#1b202e] mb-2.5">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-neutral-400" />
              <span className="text-xs telemetry uppercase text-neutral-300 font-bold tracking-wider">
                RAW IRC & PUSHER EVENT STREAM
              </span>
            </div>
            <button
              onClick={() => setChatLogs([])}
              className="text-[10px] telemetry text-neutral-500 hover:text-neutral-300"
            >
              CLEAR FEED
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-2 telemetry text-xs">
            {chatLogs.map((log, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg border ${
                  log.type === 'system'
                    ? 'bg-[#0f121b] border-[#181c2b] text-neutral-400 text-[11px]'
                    : 'bg-[#121622] border-[#1c2233] text-neutral-200'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-neutral-500 mb-0.5">
                  <span className="font-bold text-neutral-300">
                    {log.type === 'system' ? 'LOG // SYSTEM' : `@${log.username}`}
                  </span>
                  <span>{log.time}</span>
                </div>
                <div className="break-words font-sans text-xs">{log.message}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
