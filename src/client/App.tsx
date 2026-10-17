import React, { useState, useEffect } from 'react';
import { useSocket } from './hooks/useSocket.js';
import { api } from './utils/api.js';
import { OverlayApp } from './overlay/OverlayApp.js';
import { Header } from './components/Header.js';
import { Sidebar, TabType } from './components/Sidebar.js';
import { Overview } from './components/Overview.js';
import { GiveawayControls } from './components/GiveawayControls.js';
import { ParticipantsList } from './components/ParticipantsList.js';
import { OverlayPreview } from './components/OverlayPreview.js';
import { ChatSimulator } from './components/ChatSimulator.js';
import { GiveawayHistory } from './components/GiveawayHistory.js';
import { SettingsView } from './components/SettingsView.js';
import { ConfirmModal, ManualAddModal, AdminAuthModal } from './components/Modals.js';
import type { Participant, AppSettings } from '../shared/types.js';

export const App: React.FC = () => {
  // Check if current route is the standalone OBS overlay
  const isOverlayRoute = window.location.pathname.startsWith('/overlay');
  if (isOverlayRoute) {
    return <OverlayApp />;
  }

  // Dashboard state
  const {
    connected,
    giveaway,
    participants,
    kickBot,
    overlaySettings,
    history,
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

  // Load app settings
  useEffect(() => {
    fetch('/api/settings/app')
      .then((res) => res.json())
      .then((data) => setAppSettings(data))
      .catch(() => {});
  }, []);

  // API Handlers
  const handleCreateGiveaway = async (title: string, prize: string, keyword: string) => {
    await api.createGiveaway({ title, prize, keyword });
    setCurrentTab('controls');
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
    await api.resetGiveaway();
  };

  const handleRemoveParticipant = (participant: Participant) => {
    setConfirmModalData({
      isOpen: true,
      title: 'Remove Participant',
      message: `Are you sure you want to remove @${participant.username} from this giveaway? They will not be eligible to win.`,
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

  const handleConnectKick = async () => {
    await api.connectKick();
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

  return (
    <div className="min-h-screen bg-brand-charcoal text-neutral-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        kickBot={kickBot}
        overlaySettings={overlaySettings}
        overlayToken={appSettings.overlayToken}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        isAdminAuthenticated={!!adminSecret}
      />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Persistent Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          participantCount={giveaway?.participantCount || 0}
          giveawayStatus={giveaway?.status}
          accentColor={overlaySettings.accentColor}
        />

        {/* Tab View Container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-brand-charcoal">
          <div className="max-w-7xl mx-auto">
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
                onCreateNew={() => setCurrentTab('controls')}
              />
            )}

            {currentTab === 'controls' && (
              <GiveawayControls
                giveaway={giveaway}
                participants={participants}
                overlaySettings={overlaySettings}
                onCreateGiveaway={handleCreateGiveaway}
                onOpenEntries={handleOpenEntries}
                onCloseEntries={handleCloseEntries}
                onUpdateKeyword={handleUpdateKeyword}
                onStartDraw={handleStartDraw}
                onRevealWinner={handleRevealWinner}
                onResetGiveaway={handleResetGiveaway}
                onOpenResetConfirmModal={() =>
                  setConfirmModalData({
                    isOpen: true,
                    title: 'Reset Giveaway',
                    message:
                      'Are you sure you want to reset this giveaway? Completed records will remain stored in Giveaway History.',
                    action: async () => {
                      await handleResetGiveaway();
                      setConfirmModalData((prev) => ({ ...prev, isOpen: false }));
                    },
                  })
                }
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

      {/* Modals */}
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
