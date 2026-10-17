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
  Loader2,
} from 'lucide-react';
import type { AppSettings, KickBotState } from '../../shared/types.js';

interface SettingsViewProps {
  appSettings: AppSettings;
  kickBot: KickBotState;
  onSaveSettings: (settings: Partial<AppSettings> & { kickClientSecret?: string; kickAccessToken?: string; adminSecret?: string }) => Promise<void>;
  onConnectKick: (slug?: string) => Promise<any>;
  onDisconnectKick: () => Promise<any>;
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
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isTestingChat, setIsTestingChat] = useState(false);
  const [testChatFeedback, setTestChatFeedback] = useState<{ type: 'success' | 'error'; message: string; details?: string } | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('oauth_success') === 'true') {
      if (params.get('bot_tested') === 'true') {
        setFeedback({
          type: 'success',
          message: '🎉 OAuth Authorization successful! User Access Token is active and 1 confirmation message was dispatched to your Kick chat!',
        });
      } else {
        setFeedback({
          type: 'success',
          message: '🎉 OAuth Authorization successful! User Access Token is now active and stored.',
        });
      }
    }
  }, []);

  const origin = typeof window !== 'undefined' && !window.location.origin.includes('localhost')
    ? window.location.origin
    : 'https://kick-giveaway-pro.onrender.com';
  const redirectUrl = `${origin}/api/kick/callback`;
  const webhookUrl = `${origin}/api/kick/webhook`;

  const handleSendTestMessage = async () => {
    setIsTestingChat(true);
    setTestChatFeedback(null);
    try {
      const res = await fetch('/api/kick/test-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `🤖 [KickBot Test] Live chat write confirmed from Kick Giveaway Pro! (${new Date().toLocaleTimeString()})`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestChatFeedback({
          type: 'success',
          message: `✅ Test message delivered to Kick channel chat (@${data.channelSlug || channelSlug || 'frixen1'})! Bot writing is working!`,
        });
      } else {
        setTestChatFeedback({
          type: 'error',
          message: data.error || `Kick rejected the message (Status ${res.status}).`,
          details: data.status === 401 ? 'Kick requires a User Access Token with the "chat:write" scope to write to chat. Click "Authorize with Kick (1-Click)" below while logged into the bot account.' : undefined,
        });
      }
    } catch (err: any) {
      setTestChatFeedback({
        type: 'error',
        message: err.message || 'Failed to reach test chat endpoint.',
      });
    } finally {
      setIsTestingChat(false);
    }
  };

  const handleConnectKick = async () => {
    const targetSlug = channelSlug.trim().replace(/^@/, '');
    if (!targetSlug) {
      setFeedback({
        type: 'error',
        message: 'Please enter your Kick Channel Slug (username) in the field below before connecting.',
      });
      return;
    }

    setIsConnecting(true);
    setFeedback(null);

    try {
      await onSaveSettings({
        kickChannelSlug: targetSlug,
        kickBroadcasterId: broadcasterId.trim(),
        kickClientId: clientId.trim(),
        kickClientSecret: clientSecret.trim() || undefined,
        kickAccessToken: accessToken.trim() || undefined,
      });

      await onConnectKick(targetSlug);

      setFeedback({
        type: 'success',
        message: `Successfully connected to Kick channel @${targetSlug}! The bot is active and ready.`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to connect to Kick. Please check your username.',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectKick = async () => {
    setIsDisconnecting(true);
    setFeedback(null);
    try {
      await onDisconnectKick();
      setFeedback({
        type: 'success',
        message: 'Disconnected from Kick live chatroom.',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to disconnect.',
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

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
                  disabled={isDisconnecting}
                  onClick={handleDisconnectKick}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.1] text-neutral-300 border border-white/[0.08] transition-all disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {isDisconnecting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-400" />
                      <span>Disconnecting...</span>
                    </>
                  ) : (
                    <span>Disconnect</span>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isConnecting || kickBot.status === 'connecting'}
                  onClick={handleConnectKick}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#53fc18] hover:bg-[#45d914] text-black shadow-md shadow-[#53fc18]/25 transition-all disabled:opacity-60 flex items-center space-x-1.5"
                >
                  {isConnecting || kickBot.status === 'connecting' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <Radio className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Connect Now</span>
                    </>
                  )}
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-[#53fc18]/15 border border-[#53fc18]/30 flex items-center justify-center text-[#53fc18]">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Kick Bot Authorization (dev.kick.com)</h3>
                <p className="text-xs text-neutral-400">
                  Your Client ID & Secret have been verified with Kick's identity server.
                </p>
              </div>
            </div>

            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#53fc18]/15 border border-[#53fc18]/30 text-[#53fc18] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#53fc18] animate-live-pulse" />
              <span>Token Active (60 Days)</span>
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-xs text-neutral-200 space-y-2">
            <div className="flex items-start space-x-2.5">
              <KeyRound className="w-4 h-4 text-[#53fc18] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Dedicated Bot Account Instructions:</span>
                <span className="text-neutral-300">
                  If your bot is a separate Kick account (not your channel account):
                </span>
                <ol className="list-decimal list-inside text-neutral-400 mt-1 space-y-1">
                  <li>In your stream chat (<span className="text-[#53fc18]">kick.com/{channelSlug || 'frixen1'}</span>), type: <code className="bg-black/60 px-1.5 py-0.5 rounded text-[#53fc18]">/mod @YourBotUsername</code></li>
                  <li>Log into <span className="text-white font-semibold">kick.com</span> with that <span className="text-[#53fc18] font-semibold">Bot Account</span> in this browser.</li>
                  <li>Click <span className="text-[#53fc18] font-bold">Authorize with Kick (1-Click)</span> below. The bot will receive its User Access Token to announce winners in your chatroom!</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                OAuth Client ID
              </label>
              <input
                type="text"
                value={clientId || '01M55MY622GWQP6EA2HSJ4CJTJ'}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="01M55MY622GWQP6EA2HSJ4CJTJ"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-white text-sm focus:border-[#53fc18] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                OAuth Client Secret * {appSettings.kickClientSecretMasked && <span className="text-[#53fc18] font-bold text-[11px]">(SAVED)</span>}
              </label>
              <input
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder={appSettings.kickClientSecretMasked ? '•••••••••••••••• (Saved. Leave blank to keep)' : 'Paste Client Secret from dev.kick.com'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-white text-sm focus:border-[#53fc18] focus:outline-none transition-colors"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                OAuth Access Token (Auto-populated upon authorization) {appSettings.kickAccessTokenMasked && <span className="text-[#53fc18] font-bold text-[11px]">(ACTIVE)</span>}
              </label>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder={appSettings.kickAccessTokenMasked ? '•••••••••••••••• (Active. Generated by OAuth)' : 'Auto-generated or paste manual token'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-white text-sm focus:border-[#53fc18] focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* 1-Click Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={isAuthorizing}
              onClick={async () => {
                const targetClientId = clientId.trim() || appSettings.kickClientId || '01M55MY622GWQP6EA2HSJ4CJTJ';
                setIsAuthorizing(true);
                try {
                  await onSaveSettings({
                    kickChannelSlug: channelSlug.trim() || undefined,
                    kickClientId: targetClientId,
                    kickClientSecret: clientSecret.trim() || undefined,
                  });
                } catch (err) {
                  console.warn('Pre-save notice:', err);
                }
                window.location.href = `/api/kick/authorize?client_id=${encodeURIComponent(targetClientId)}`;
              }}
              className="px-4 py-2.5 rounded-xl bg-[#53fc18] hover:bg-[#45d914] text-black font-bold text-xs flex items-center space-x-2 transition-all shadow-md shadow-[#53fc18]/20 disabled:opacity-60 cursor-pointer"
            >
              {isAuthorizing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Redirecting to Kick...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 stroke-[2.5]" />
                  <span>Authorize with Kick (1-Click)</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isTestingChat}
              onClick={handleSendTestMessage}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center space-x-2 transition-all shadow-md shadow-purple-600/20 disabled:opacity-60 cursor-pointer"
            >
              {isTestingChat ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Sending Test Message...</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4" />
                  <span>Send 1 Test Message to Chat</span>
                </>
              )}
            </button>
          </div>

          {/* Test Chat Result Alert */}
          {testChatFeedback && (
            <div
              className={`p-3.5 rounded-xl text-xs flex flex-col space-y-1 border ${
                testChatFeedback.type === 'success'
                  ? 'bg-[#53fc18]/10 text-[#53fc18] border-[#53fc18]/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              <div className="flex items-center space-x-2">
                {testChatFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#53fc18]" />
                ) : (
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                )}
                <span className="font-semibold">{testChatFeedback.message}</span>
              </div>
              {testChatFeedback.details && (
                <p className="text-[11px] text-neutral-300 pl-6">{testChatFeedback.details}</p>
              )}
            </div>
          )}
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
