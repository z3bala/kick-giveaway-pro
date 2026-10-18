import React, { useState, useEffect } from 'react';
import { useSocket } from './hooks/useSocket.js';
import { api } from './utils/api.js';
import { OverlayApp } from './overlay/OverlayApp.js';
import { Sidebar, type TabType } from './components/Sidebar.js';
import { Header } from './components/Header.js';
import { Overview } from './components/Overview.js';
import { GiveawayControls } from './components/GiveawayControls.js';
import { ParticipantsList } from './components/ParticipantsList.js';
import { OverlayPreview } from './components/OverlayPreview.js';
import { ChatSimulator } from './components/ChatSimulator.js';
import { GiveawayHistory } from './components/GiveawayHistory.js';
import { SettingsView } from './components/SettingsView.js';
import { GuessTheBalance } from './components/GuessTheBalance.js';
import { ConfirmModal, ManualAddModal, AdminAuthModal } from './components/Modals.js';
import type { Participant, AppSettings } from '../shared/types.js';

export const App: React.FC = () => {
  // Check if current route is the standalone OBS overlay
  const isOverlayRoute = window.location.pathname.startsWith('/overlay');
  if (isOverlayRoute) {
    return <OverlayApp />;
  }

  // Dashboard real-time state
  const {
    connected,
    giveaway,
    participants,
    kickBot,
    overlaySettings,
    activeDraw,
    history,
    gtbEvent,
    gtbGuesses,
  } = useSocket({ clientType: 'dashboard' });

  const [currentTab, setCurrentTab] = useState<TabType>('overview');

  const [appSettings, setAppSettings] = useState<AppSettings>({
    kickChannelSlug: '',
    kickBroadcasterId: '',
    kickClientId: '',
    kickClientSecretMasked: '',
    kickAccessTokenMasked: '',
    defaultKeyword: '!join',
    botReplyEnabled: true,
    botAnnounceWinner: true,
    botChatCooldownMs: 1500,
    requireFollower: false,
    minAccountAgeDays: 0,
    overlayToken: 'streamer-obs-overlay-key-2026',
    adminProtected: false,
  });

  const [adminSecret, setAdminSecret] = useState(api.getAdminSecret());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isManualAddModalOpen, setIsManualAddModalOpen] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: async () => {},
  });

  useEffect(() => {
    fetch('/api/settings/app')
      .then((res) => res.json())
      .then((data) => setAppSettings(data))
      .catch(() => {});
  }, []);

  // Action Handlers
  const handleCreateGiveaway = async (
    title: string,
    prize: string,
    keyword: string,
    wheelEnabled?: boolean,
    wheelAmounts?: string[]
  ) => {
    await api.createGiveaway({ title, prize, keyword, wheelEnabled, wheelAmounts });
  };

  const handleUpdateWheel = async (wheelEnabled: boolean, wheelAmounts?: string[]) => {
    await api.updateGiveawayWheel(wheelEnabled, wheelAmounts);
  };

  const handleOpenEntries = async () => {
    await api.openGiveaway();
  };

  const handleCloseEntries = async () => {
    await api.closeGiveaway();
  };

  const handleUpdateKeyword = async (keyword: string) => {
    await api.updateKeyword(keyword);
  };

  const handleStartDraw = async () => {
    await api.startDraw();
  };

  const handleRevealWinner = async () => {
    await api.revealWinner();
  };

  const handleResetGiveaway = async () => {
    setConfirmModalData({
      isOpen: true,
      title: 'Reset Active Giveaway',
      message: 'Are you sure you want to reset this giveaway? The current record will remain safely archived in your history ledger.',
      action: async () => {
        await api.resetGiveaway();
        setConfirmModalData((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleRemoveParticipant = (participant: Participant) => {
    setConfirmModalData({
      isOpen: true,
      title: 'Remove Participant',
      message: `Are you sure you want to remove @${participant.username} from this giveaway pool?`,
      action: async () => {
        await api.removeParticipant(participant.id);
        setConfirmModalData((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleManualAdd = async (username: string) => {
    await api.manualAddParticipant(username);
  };

  const handleSimulateChat = async (username: string, message: string) => {
    await api.simulateChat(username, message);
  };

  const handleConnectKick = async (channelSlug?: string) => {
    return await api.connectKick(channelSlug);
  };

  const handleDisconnectKick = async () => {
    await api.disconnectKick();
  };

  const handleUpdateOverlaySettings = async (newSettings: any) => {
    await api.updateOverlaySettings(newSettings);
  };

  const handleSaveAppSettings = async (settings: any) => {
    const updated = await api.updateAppSettings(settings);
    setAppSettings(updated);
  };

  const handleSaveAdminSecret = (secret: string) => {
    api.setAdminSecret(secret);
    setAdminSecret(secret);
  };

  // GTB Event Handlers
  const handleCreateGtb = async (title: string, prize: string, keyword?: string) => {
    await api.createGtbEvent({ title, prize, keyword });
  };

  const handleCloseGtb = async () => {
    await api.closeGtbEvent();
  };

  const handleResolveGtb = async (finalBalance: number) => {
    await api.resolveGtbEvent(finalBalance);
  };

  const handleResetGtb = async () => {
    await api.resetGtbEvent();
  };

  const handleManualGtb = async (username: string, guess: number) => {
    await api.addManualGtbGuess(username, guess);
  };

  const tabTitles: Record<TabType, string> = {
    overview: 'Dashboard',
    controls: 'Giveaway Controls',
    participants: 'Participants Pool',
    gtb: 'Guess The Balance (Stake.com)',
    overlay: 'OBS Overlay Studio',
    simulator: 'Chat Simulator',
    history: 'History & Winners',
    settings: 'Settings & Kick Bot',
  };

  return (
    <div className="min-h-screen bg-[#090b10] text-neutral-100 flex font-sans select-none">
      {/* Sleek Modern Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        participantCount={participants.length}
        giveawayStatus={giveaway?.status}
        gtbStatus={gtbEvent?.status}
        gtbGuessCount={gtbGuesses.length}
        kickChannelSlug={kickBot.channelSlug || appSettings.kickChannelSlug}
        isKickConnected={kickBot.status === 'connected'}
        overlayToken={appSettings.overlayToken}
        isAdminAuthenticated={!!adminSecret}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        accentColor={overlaySettings.accentColor}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <Header
          currentTabName={tabTitles[currentTab]}
          kickBot={kickBot}
          overlaySettings={overlaySettings}
          overlayToken={appSettings.overlayToken}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          isAdminAuthenticated={!!adminSecret}
        />

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {currentTab === 'overview' && (
              <Overview
                giveaway={giveaway}
                participants={participants}
                kickBot={kickBot}
                overlaySettings={overlaySettings}
                onNavigateTab={setCurrentTab}
                onOpenGiveaway={handleOpenEntries}
                onCloseGiveaway={handleCloseEntries}
                onStartDraw={handleStartDraw}
                onRevealWinner={handleRevealWinner}
                onCreateNew={() => setCurrentTab('controls')}
              />
            )}

            {currentTab === 'controls' && (
              <GiveawayControls
                giveaway={giveaway}
                participants={participants}
                overlaySettings={overlaySettings}
                onCreateGiveaway={handleCreateGiveaway}
                onUpdateWheel={handleUpdateWheel}
                onOpenEntries={handleOpenEntries}
                onCloseEntries={handleCloseEntries}
                onUpdateKeyword={handleUpdateKeyword}
                onStartDraw={handleStartDraw}
                onRevealWinner={handleRevealWinner}
                onResetGiveaway={handleResetGiveaway}
                onOpenResetConfirmModal={handleResetGiveaway}
              />
            )}

            {currentTab === 'participants' && (
              <ParticipantsList
                participants={participants}
                overlaySettings={overlaySettings}
                giveawayId={giveaway?.id}
                onRemoveParticipant={handleRemoveParticipant}
                onOpenManualAddModal={() => setIsManualAddModalOpen(true)}
              />
            )}

            {currentTab === 'gtb' && (
              <GuessTheBalance
                gtbEvent={gtbEvent}
                gtbGuesses={gtbGuesses}
                onCreateEvent={handleCreateGtb}
                onCloseEvent={handleCloseGtb}
                onResolveEvent={handleResolveGtb}
                onResetEvent={handleResetGtb}
                onManualGuess={handleManualGtb}
                accentColor={overlaySettings.accentColor}
              />
            )}

            {currentTab === 'overlay' && (
              <OverlayPreview
                settings={overlaySettings}
                overlayToken={appSettings.overlayToken}
                onUpdateSettings={handleUpdateOverlaySettings}
              />
            )}

            {currentTab === 'simulator' && (
              <ChatSimulator
                giveaway={giveaway}
                onSimulateChat={handleSimulateChat}
                accentColor={overlaySettings.accentColor}
              />
            )}

            {currentTab === 'history' && (
              <GiveawayHistory
                history={history}
                accentColor={overlaySettings.accentColor}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsView
                appSettings={appSettings}
                kickBot={kickBot}
                onSaveSettings={handleSaveAppSettings}
                onConnectKick={handleConnectKick}
                onDisconnectKick={handleDisconnectKick}
                accentColor={overlaySettings.accentColor}
              />
            )}
          </div>
        </main>
      </div>

      {/* Confirmation & Authorization Modals */}
      <ConfirmModal
        isOpen={confirmModalData.isOpen}
        title={confirmModalData.title}
        message={confirmModalData.message}
        onConfirm={confirmModalData.action}
        onCancel={() => setConfirmModalData((prev) => ({ ...prev, isOpen: false }))}
      />

      <ManualAddModal
        isOpen={isManualAddModalOpen}
        onAdd={handleManualAdd}
        onClose={() => setIsManualAddModalOpen(false)}
        accentColor={overlaySettings.accentColor}
      />

      <AdminAuthModal
        isOpen={isAuthModalOpen}
        currentSecret={adminSecret}
        onSave={handleSaveAdminSecret}
        onClose={() => setIsAuthModalOpen(false)}
        accentColor={overlaySettings.accentColor}
      />
    </div>
  );
};
