import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Radio,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  ExternalLink,
  Save,
  MessageSquare,
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
  accentColor = '#e11d48',
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

      // Clear plaintext sensitive input fields after save
      setClientSecret('');
      setAccessToken('');
      setAdminSecret('');

      setFeedback({ type: 'success', message: 'Settings saved and bot configuration reloaded!' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">System & Kick Configuration</h2>
        <p className="text-sm text-neutral-400">
          Manage your Kick channel credentials, bot rate limits, and dashboard security keys.
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

      <form onSubmit={handleSave} className="space-y-6">
        {/* Kick Channel & Connection Card */}
        <div className="p-6 rounded-2xl bg-brand-surface border border-brand-border space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-brand-border">
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-kick-green" />
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                Kick Channel Connection
              </h3>
            </div>

            {/* Connection Actions */}
            <div className="flex items-center space-x-2">
              {kickBot.status === 'connected' ? (
                <button
                  type="button"
                  onClick={onDisconnectKick}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-surface2 hover:bg-brand-surface3 border border-brand-border text-neutral-300"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onConnectKick}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                >
                  Connect Now
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">
                Channel Slug (Username)
              </label>
              <input
                type="text"
                required
                value={channelSlug}
                onChange={(e) => setChannelSlug(e.target.value)}
                placeholder="e.g. yourkickchannel"
                className="w-full px-3 py-2 rounded-xl bg-brand-surface2 border border-brand-border text-white text-xs font-mono focus:outline-none"
              />
              <p className="text-[11px] text-neutral-500 mt-1">
                The Kick username where the giveaway chat commands will be read.
              </p>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">
                Broadcaster User ID (Optional)
              </label>
              <input
                type="text"
                value={broadcasterId}
                onChange={(e) => setBroadcasterId(e.target.value)}
                placeholder="Auto-resolved if blank"
                className="w-full px-3 py-2 rounded-xl bg-brand-surface2 border border-brand-border text-white text-xs font-mono focus:outline-none"
              />
              <p className="text-[11px] text-neutral-500 mt-1">
                Numeric user ID on Kick. Resolved automatically from your channel slug.
              </p>
            </div>
          </div>
        </div>

        {/* Kick Developer API Credentials (dev.kick.com) */}
        <div className="p-6 rounded-2xl bg-brand-surface border border-brand-border space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-brand-border">
            <div className="flex items-center space-x-2">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                Kick Developer API Authentication
              </h3>
            </div>
            <a
              href="https://dev.kick.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-neutral-400 hover:text-white flex items-center space-x-1"
            >
              <span>Kick Dev Portal</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="text-xs text-neutral-400 leading-relaxed">
            Configure official Kick API credentials to send chat replies and announce winners into your channel chat. Secrets are masked and stored securely in environment / persistent SQLite.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">
                OAuth Client ID
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="From dev.kick.com"
                className="w-full px-3 py-2 rounded-xl bg-brand-surface2 border border-brand-border text-white text-xs font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">
                OAuth Client Secret {appSettings.kickClientSecretMasked && <span className="text-emerald-400 font-mono">(Saved)</span>}
              </label>
              <input
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder={appSettings.kickClientSecretMasked ? '•••••••••••••••• (Leave empty to keep current)' : 'Enter Client Secret'}
                className="w-full px-3 py-2 rounded-xl bg-brand-surface2 border border-brand-border text-white text-xs font-mono focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">
                OAuth Bearer Access Token {appSettings.kickAccessTokenMasked && <span className="text-emerald-400 font-mono">(Saved)</span>}
              </label>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder={appSettings.kickAccessTokenMasked ? '•••••••••••••••• (Leave empty to keep current)' : 'Bearer Token with chat:write & channel:read scopes'}
                className="w-full px-3 py-2 rounded-xl bg-brand-surface2 border border-brand-border text-white text-xs font-mono focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Bot Behavior & Rate Limits */}
        <div className="p-6 rounded-2xl bg-brand-surface border border-brand-border space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-brand-border">
            <MessageSquare className="w-4 h-4 text-neutral-400" />
            <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
              Bot Chat & Anti-Flood Settings
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">
                Default Entry Keyword
              </label>
              <input
                type="text"
                required
                value={defaultKeyword}
                onChange={(e) => setDefaultKeyword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-brand-surface2 border border-brand-border text-white text-xs font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">
                Chat Outbound Cooldown (ms)
              </label>
              <input
                type="number"
                min="500"
                max="10000"
                step="100"
                value={botChatCooldownMs}
                onChange={(e) => setBotChatCooldownMs(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-brand-surface2 border border-brand-border text-white text-xs font-mono focus:outline-none"
              />
              <p className="text-[11px] text-neutral-500 mt-1">
                Throttles outbound chat messages to avoid Kick rate limits.
              </p>
            </div>
          </div>

          <div className="pt-2 space-y-2 text-xs">
            <label className="flex items-center justify-between text-neutral-300 cursor-pointer">
              <span>Send Entry Confirmation in Chat</span>
              <input
                type="checkbox"
                checked={botReplyEnabled}
                onChange={(e) => setBotReplyEnabled(e.target.checked)}
                className="w-4 h-4 rounded bg-brand-surface3 border-brand-border text-red-600 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between text-neutral-300 cursor-pointer">
              <span>Automatically Announce Winner in Chat</span>
              <input
                type="checkbox"
                checked={botAnnounceWinner}
                onChange={(e) => setBotAnnounceWinner(e.target.checked)}
                className="w-4 h-4 rounded bg-brand-surface3 border-brand-border text-red-600 focus:ring-0"
              />
            </label>
          </div>
        </div>

        {/* Security & Access Protection */}
        <div className="p-6 rounded-2xl bg-brand-surface border border-brand-border space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-brand-border">
            <Shield className="w-4 h-4 text-neutral-400" />
            <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
              Security & Tokens
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">
                Admin Secret Key {appSettings.adminProtected && <span className="text-emerald-400 font-mono">(Active)</span>}
              </label>
              <input
                type="password"
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                placeholder="Passphrase to protect dashboard actions"
                className="w-full px-3 py-2 rounded-xl bg-brand-surface2 border border-brand-border text-white text-xs font-mono focus:outline-none"
              />
              <p className="text-[11px] text-neutral-500 mt-1">
                Protect giveaway controls when deployed to public hosting.
              </p>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">
                OBS Overlay Token
              </label>
              <input
                type="text"
                value={overlayToken}
                onChange={(e) => setOverlayToken(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-brand-surface2 border border-brand-border text-white text-xs font-mono focus:outline-none"
              />
              <p className="text-[11px] text-neutral-500 mt-1">
                Scoped read-only token appended to the OBS browser source URL.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg flex items-center space-x-2 transition-all hover:brightness-110"
            style={{ backgroundColor: accentColor }}
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Settings...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
