import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Radio,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Save,
  MessageSquare,
  Sliders,
} from 'lucide-react';
import type { AppSettings, KickBotState } from '../../shared/types.js';

interface SettingsViewProps {
  appSettings: AppSettings;
  kickBot: KickBotState;
  onSaveSettings: (settings: Partial<AppSettings> & { kickClientSecret?: string; kickAccessToken?: string; adminSecret?: string }) => Promise<void>;
  onConnectKick: () => Promise<void>;
  onDisconnectKick: () => Promise<void>;
  accentColor?: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  appSettings,
  kickBot,
  onSaveSettings,
  onConnectKick,
  onDisconnectKick,
  accentColor = '#e63946',
}) => {
  const [channelSlug, setChannelSlug] = useState(appSettings.kickChannelSlug || '');
  const [broadcasterId, setBroadcasterId] = useState(appSettings.kickBroadcasterId || '');
  const [clientId, setClientId] = useState(appSettings.kickClientId || '');
  const [clientSecret, setClientSecret] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [overlayToken, setOverlayToken] = useState(appSettings.overlayToken || '');

  const [defaultKeyword, setDefaultKeyword] = useState(appSettings.defaultKeyword || '!join');
  const [botReplyEnabled, setBotReplyEnabled] = useState(appSettings.botReplyEnabled ?? true);
  const [botAnnounceWinner, setBotAnnounceWinner] = useState(appSettings.botAnnounceWinner ?? true);
  const [botChatCooldownMs, setBotChatCooldownMs] = useState(appSettings.botChatCooldownMs || 1500);

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      await onSaveSettings({
        kickChannelSlug: channelSlug.trim(),
        kickBroadcasterId: broadcasterId.trim(),
        kickClientId: clientId.trim(),
        kickClientSecret: clientSecret.trim() || undefined,
        kickAccessToken: accessToken.trim() || undefined,
        adminSecret: adminSecret.trim() || undefined,
        overlayToken: overlayToken.trim(),
        defaultKeyword: defaultKeyword.trim(),
        botReplyEnabled,
        botAnnounceWinner,
        botChatCooldownMs: Number(botChatCooldownMs),
      });

      setClientSecret('');
      setAccessToken('');
      setAdminSecret('');

      setFeedback({ type: 'success', message: 'System configuration updated and bot reloaded.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-4 border-b border-[#1b1f2e]">
        <h2 className="text-xl font-black text-white tracking-wider uppercase telemetry">
          System & Kick Uplink Configuration
        </h2>
        <p className="text-xs text-neutral-400 mt-0.5">
          Configure Kick developer API credentials, anti-flood rate limits, and dashboard security tokens.
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

      <form onSubmit={handleSave} className="space-y-5">
        {/* Kick Channel Uplink */}
        <div className="p-4 rounded-xl tactical-surface space-y-3.5">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#1b202e]">
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-[#53fc18]" />
              <h3 className="text-xs font-bold text-white uppercase telemetry tracking-wider">
                Kick Channel Uplink
              </h3>
            </div>

            <div className="flex items-center space-x-2">
              {kickBot.status === 'connected' ? (
                <button
                  type="button"
                  onClick={onDisconnectKick}
                  className="px-3 py-1 rounded-md text-xs telemetry font-bold bg-[#141722] hover:bg-[#1c2234] border border-[#23293c] text-neutral-300"
                >
                  DISCONNECT
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onConnectKick}
                  className="px-3 py-1 rounded-md text-xs telemetry font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                >
                  CONNECT UPLINK
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[10px] telemetry uppercase text-neutral-400 mb-1 font-bold">
                Channel Slug (Username)
              </label>
              <input
                type="text"
                required
                value={channelSlug}
                onChange={(e) => setChannelSlug(e.target.value)}
                placeholder="e.g. xqc or yourchannel"
                className="w-full px-3 py-1.5 rounded-lg bg-[#11141e] border border-[#1e2436] text-white text-xs telemetry focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] telemetry uppercase text-neutral-400 mb-1 font-bold">
                Broadcaster User ID (Optional)
              </label>
              <input
                type="text"
                value={broadcasterId}
                onChange={(e) => setBroadcasterId(e.target.value)}
                placeholder="Auto-resolved from slug if blank"
                className="w-full px-3 py-1.5 rounded-lg bg-[#11141e] border border-[#1e2436] text-white text-xs telemetry focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Kick Developer API Credentials */}
        <div className="p-4 rounded-xl tactical-surface space-y-3.5">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#1b202e]">
            <div className="flex items-center space-x-2">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white uppercase telemetry tracking-wider">
                Official Kick Developer API (dev.kick.com)
              </h3>
            </div>
            <a
              href="https://dev.kick.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] telemetry text-neutral-400 hover:text-white flex items-center space-x-1"
            >
              <span>DEV PORTAL</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[10px] telemetry uppercase text-neutral-400 mb-1 font-bold">
                OAuth Client ID
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="From dev.kick.com"
                className="w-full px-3 py-1.5 rounded-lg bg-[#11141e] border border-[#1e2436] text-white text-xs telemetry focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] telemetry uppercase text-neutral-400 mb-1 font-bold">
                OAuth Client Secret {appSettings.kickClientSecretMasked && <span className="text-emerald-400">(CONFIGURED)</span>}
              </label>
              <input
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder={appSettings.kickClientSecretMasked ? '•••••••••••••••• (Leave blank to preserve)' : 'Enter Client Secret'}
                className="w-full px-3 py-1.5 rounded-lg bg-[#11141e] border border-[#1e2436] text-white text-xs telemetry focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] telemetry uppercase text-neutral-400 mb-1 font-bold">
                OAuth Access Token {appSettings.kickAccessTokenMasked && <span className="text-emerald-400">(CONFIGURED)</span>}
              </label>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder={appSettings.kickAccessTokenMasked ? '•••••••••••••••• (Leave blank to preserve)' : 'Bearer Token with chat:write & channel:read'}
                className="w-full px-3 py-1.5 rounded-lg bg-[#11141e] border border-[#1e2436] text-white text-xs telemetry focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Rate Limiting & Bot Replies */}
        <div className="p-4 rounded-xl tactical-surface space-y-3.5">
          <div className="flex items-center space-x-2 pb-2.5 border-b border-[#1b202e]">
            <MessageSquare className="w-4 h-4 text-neutral-400" />
            <h3 className="text-xs font-bold text-white uppercase telemetry tracking-wider">
              Rate Limits & Outbound Queue
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[10px] telemetry uppercase text-neutral-400 mb-1 font-bold">
                Default Entry Keyword
              </label>
              <input
                type="text"
                required
                value={defaultKeyword}
                onChange={(e) => setDefaultKeyword(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-[#11141e] border border-[#1e2436] text-white text-xs telemetry focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] telemetry uppercase text-neutral-400 mb-1 font-bold">
                Chat Outbound Cooldown (ms)
              </label>
              <input
                type="number"
                min="500"
                max="10000"
                step="100"
                value={botChatCooldownMs}
                onChange={(e) => setBotChatCooldownMs(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg bg-[#11141e] border border-[#1e2436] text-white text-xs telemetry focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 space-y-2 text-xs telemetry">
            <label className="flex items-center justify-between text-neutral-300 cursor-pointer">
              <span>SEND ENTRY CONFIRMATION IN KICK CHAT</span>
              <input
                type="checkbox"
                checked={botReplyEnabled}
                onChange={(e) => setBotReplyEnabled(e.target.checked)}
                className="w-4 h-4 rounded bg-[#11141e] border-[#1e2436] text-red-600 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between text-neutral-300 cursor-pointer">
              <span>ANNOUNCE VICTOR IN KICK CHAT</span>
              <input
                type="checkbox"
                checked={botAnnounceWinner}
                onChange={(e) => setBotAnnounceWinner(e.target.checked)}
                className="w-4 h-4 rounded bg-[#11141e] border-[#1e2436] text-red-600 focus:ring-0"
              />
            </label>
          </div>
        </div>

        {/* Security Keys */}
        <div className="p-4 rounded-xl tactical-surface space-y-3.5">
          <div className="flex items-center space-x-2 pb-2.5 border-b border-[#1b202e]">
            <Shield className="w-4 h-4 text-neutral-400" />
            <h3 className="text-xs font-bold text-white uppercase telemetry tracking-wider">
              Security Tokens & Protection
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[10px] telemetry uppercase text-neutral-400 mb-1 font-bold">
                Master Admin Key {appSettings.adminProtected && <span className="text-emerald-400">(ACTIVE)</span>}
              </label>
              <input
                type="password"
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                placeholder="Passphrase protecting deck actions"
                className="w-full px-3 py-1.5 rounded-lg bg-[#11141e] border border-[#1e2436] text-white text-xs telemetry focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] telemetry uppercase text-neutral-400 mb-1 font-bold">
                OBS Overlay Scoped Token
              </label>
              <input
                type="text"
                value={overlayToken}
                onChange={(e) => setOverlayToken(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-[#11141e] border border-[#1e2436] text-white text-xs telemetry focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-lg text-xs telemetry font-bold text-white shadow-sm flex items-center space-x-2 transition-all hover:brightness-110 uppercase tracking-wider"
            style={{ backgroundColor: accentColor }}
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'UPDATING...' : 'SAVE CONFIGURATION'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
