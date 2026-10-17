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
  Copy,
  Check,
  Lock,
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
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const origin = window.location.origin;
  const redirectUrl = `${origin}/api/kick/callback`;
  const webhookUrl = `${origin}/api/kick/webhook`;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

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

      setFeedback({ type: 'success', message: 'Settings saved and connection updated successfully.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Channel & Bot Settings</h2>
        <p className="text-xs text-neutral-400 mt-1">
          Connect your Kick channel, configure official Kick Developer OAuth keys, and adjust bot preferences.
        </p>
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

      {/* Kick Developer Portal Helper Card (Answers Redirect URL question!) */}
      <div className="p-5 rounded-2xl glass-card space-y-4 border border-[#53fc18]/25 bg-gradient-to-br from-[#121824] to-[#0c1018]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#53fc18]/20 text-[#53fc18] flex items-center justify-center font-bold text-xs">
              K
            </div>
            <h3 className="text-sm font-bold text-white">Kick Developer App Information</h3>
          </div>
          <a
            href="https://dev.kick.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#53fc18] hover:underline flex items-center space-x-1 font-semibold"
          >
            <span>Open dev.kick.com</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <p className="text-xs text-neutral-300 leading-relaxed">
          When creating or configuring your app in the <strong className="text-white">Kick Developer Portal</strong>, use the following URLs:
        </p>

        <div className="space-y-3 pt-1">
          {/* Redirect URL */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-300">Redirect URL (OAuth Callback):</span>
              <span className="text-neutral-400 text-[11px]">Enter this in the "Redirect URL" field on Kick</span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={redirectUrl}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/[0.08] text-[#53fc18] font-mono text-xs select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(redirectUrl, 'redirect')}
                className="px-3 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/[0.1] text-xs font-semibold flex items-center space-x-1.5 flex-shrink-0 transition-all"
              >
                {copiedField === 'redirect' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#53fc18]" />
                    <span className="text-[#53fc18]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Webhook URL */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-300">Webhook URL (Event Subscriptions):</span>
              <span className="text-neutral-400 text-[11px]">For Kick chat.message.sent webhooks</span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/[0.08] text-neutral-300 font-mono text-xs select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(webhookUrl, 'webhook')}
                className="px-3 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/[0.1] text-xs font-semibold flex items-center space-x-1.5 flex-shrink-0 transition-all"
              >
                {copiedField === 'webhook' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#53fc18]" />
                    <span className="text-[#53fc18]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Kick Channel Connection */}
        <div className="p-6 rounded-2xl glass-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-[#53fc18]/15 border border-[#53fc18]/30 flex items-center justify-center text-[#53fc18]">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Kick Live Channel</h3>
                <p className="text-xs text-neutral-400">Specify the streamer channel where chat entries occur.</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {kickBot.status === 'connected' ? (
                <button
                  type="button"
                  onClick={onDisconnectKick}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.1] text-neutral-300 border border-white/[0.08] transition-all"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onConnectKick}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#53fc18] hover:bg-[#45d914] text-black shadow-sm shadow-[#53fc18]/20 transition-all"
                >
                  Connect Now
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Channel Slug (Kick Username) *
              </label>
              <input
                type="text"
                required
                value={channelSlug}
                onChange={(e) => setChannelSlug(e.target.value)}
                placeholder="e.g. xqc or yourchannel"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-white text-sm focus:border-[#53fc18] focus:outline-none transition-colors"
              />
              <p className="text-[11px] text-neutral-400 mt-1">
                The public username on kick.com/yourchannel
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Broadcaster ID (Optional)
              </label>
              <input
                type="text"
                value={broadcasterId}
                onChange={(e) => setBroadcasterId(e.target.value)}
                placeholder="Auto-detected if left empty"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-white text-sm focus:border-[#53fc18] focus:outline-none transition-colors"
              />
              <p className="text-[11px] text-neutral-400 mt-1">
                Numeric user ID from Kick API
              </p>
            </div>
          </div>
        </div>

        {/* Kick Developer API Credentials */}
        <div className="p-6 rounded-2xl glass-card space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-white/[0.08]">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">OAuth & Bot Credentials (Optional)</h3>
              <p className="text-xs text-neutral-400">
                Required only if you want the bot to post winner announcements directly into your Kick chat.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Client ID
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="From dev.kick.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-white text-sm focus:border-[#53fc18] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Client Secret {appSettings.kickClientSecretMasked && <span className="text-[#53fc18] font-bold text-[11px]">(CONFIGURED)</span>}
              </label>
              <input
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder={appSettings.kickClientSecretMasked ? '•••••••••••••••• (Leave blank to keep current)' : 'Enter Client Secret'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-white text-sm focus:border-[#53fc18] focus:outline-none transition-colors"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                OAuth Access Token {appSettings.kickAccessTokenMasked && <span className="text-[#53fc18] font-bold text-[11px]">(CONFIGURED)</span>}
              </label>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder={appSettings.kickAccessTokenMasked ? '•••••••••••••••• (Leave blank to keep current)' : 'Bearer Token with chat:write permissions'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-white text-sm focus:border-[#53fc18] focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Bot Rules & Chat Preferences */}
        <div className="p-6 rounded-2xl glass-card space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-white/[0.08]">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Chat Rules & Behavior</h3>
              <p className="text-xs text-neutral-400">Control keyword defaults and automatic bot messages in chat.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Default Entry Keyword
              </label>
              <input
                type="text"
                required
                value={defaultKeyword}
                onChange={(e) => setDefaultKeyword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-[#53fc18] font-mono text-sm focus:border-[#53fc18] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Outbound Chat Cooldown (ms)
              </label>
              <input
                type="number"
                min="500"
                max="10000"
                step="100"
                value={botChatCooldownMs}
                onChange={(e) => setBotChatCooldownMs(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-white text-sm focus:border-[#53fc18] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] cursor-pointer hover:bg-white/[0.04] transition-colors">
              <div>
                <span className="text-xs font-semibold text-white block">Acknowledge viewer entries in chat</span>
                <span className="text-[11px] text-neutral-400">Sends a whisper or brief reply when a viewer enters with the keyword</span>
              </div>
              <input
                type="checkbox"
                checked={botReplyEnabled}
                onChange={(e) => setBotReplyEnabled(e.target.checked)}
                className="w-4 h-4 rounded accent-[#53fc18] cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] cursor-pointer hover:bg-white/[0.04] transition-colors">
              <div>
                <span className="text-xs font-semibold text-white block">Announce winner in chat automatically</span>
                <span className="text-[11px] text-neutral-400">Broadcasts a congratulations message in chat when the winner is revealed</span>
              </div>
              <input
                type="checkbox"
                checked={botAnnounceWinner}
                onChange={(e) => setBotAnnounceWinner(e.target.checked)}
                className="w-4 h-4 rounded accent-[#53fc18] cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Dashboard Security */}
        <div className="p-6 rounded-2xl glass-card space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-white/[0.08]">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Dashboard Passcode & Protection</h3>
              <p className="text-xs text-neutral-400">Prevent unauthorized viewers from controlling your giveaway.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Admin Master Secret {appSettings.adminProtected && <span className="text-[#53fc18] font-bold text-[11px]">(ACTIVE)</span>}
              </label>
              <input
                type="password"
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                placeholder="Enter secret to protect dashboard"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-white text-sm focus:border-[#53fc18] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                OBS Overlay Scoped Token
              </label>
              <input
                type="text"
                value={overlayToken}
                onChange={(e) => setOverlayToken(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-white text-sm focus:border-[#53fc18] focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 rounded-xl bg-[#53fc18] hover:bg-[#45d914] text-black font-bold text-sm flex items-center space-x-2 transition-all shadow-lg shadow-[#53fc18]/25"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
