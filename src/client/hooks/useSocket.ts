import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  Giveaway,
  Participant,
  KickBotState,
  OverlaySettings,
  AppSettings,
  DrawAnimationData,
  StateSyncPayload,
} from '../../shared/types.js';

export interface UseSocketOptions {
  clientType?: 'dashboard' | 'overlay';
  token?: string;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { clientType = 'dashboard', token } = options;

  const [connected, setConnected] = useState(false);
  const [giveaway, setGiveaway] = useState<Giveaway | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [kickBot, setKickBot] = useState<KickBotState>({
    status: 'disconnected',
    channelSlug: '',
    broadcasterId: '',
    lastError: null,
    lastMessageTime: null,
    mode: 'pusher_websocket',
  });
  const [overlaySettings, setOverlaySettings] = useState<OverlaySettings>({
    theme: 'dark',
    accentColor: '#e11d48',
    cardStyle: 'modern',
    animationDurationSec: 7.5,
    soundEnabled: true,
    soundVolume: 0.8,
    showTitle: true,
    showCount: true,
    showRecentTicker: true,
    scale: 1,
  });
  const [activeDraw, setActiveDraw] = useState<DrawAnimationData | null>(null);
  const [history, setHistory] = useState<Giveaway[]>([]);
  const [recentJoined, setRecentJoined] = useState<Participant | null>(null);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io({
      query: {
        type: clientType,
        token: token || '',
      },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('request.sync');
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    // Authoritative state sync
    socket.on('state.sync', (payload: StateSyncPayload) => {
      setGiveaway(payload.giveaway);
      setParticipants(payload.participants || []);
      setKickBot(payload.kickBot);
      setOverlaySettings(payload.overlaySettings);
      setActiveDraw(payload.activeDraw);
      setHistory(payload.recentHistory || []);
    });

    socket.on('giveaway.created', (gw: Giveaway) => {
      setGiveaway(gw);
      setParticipants([]);
      setActiveDraw(null);
    });

    socket.on('giveaway.opened', (gw: Giveaway) => {
      setGiveaway(gw);
    });

    socket.on('giveaway.closed', (gw: Giveaway) => {
      setGiveaway(gw);
    });

    socket.on('giveaway.updated', (gw: Giveaway) => {
      setGiveaway(gw);
    });

    socket.on('participant.joined', (data: { participant: Participant; totalParticipants: number }) => {
      setParticipants((prev) => {
        // Prevent duplicate addition in local state
        if (prev.some((p) => p.id === data.participant.id || p.kickUserId === data.participant.kickUserId)) {
          return prev;
        }
        return [data.participant, ...prev];
      });
      setGiveaway((prev) => (prev ? { ...prev, participantCount: data.totalParticipants } : prev));
      setRecentJoined(data.participant);
    });

    socket.on('participant.removed', (data: { participantId: string; giveawayId: string; totalParticipants: number }) => {
      setParticipants((prev) => prev.filter((p) => p.id !== data.participantId));
      setGiveaway((prev) => (prev ? { ...prev, participantCount: data.totalParticipants } : prev));
    });

    socket.on('draw.started', (drawData: DrawAnimationData) => {
      setActiveDraw(drawData);
      setGiveaway((prev) => (prev ? { ...prev, status: 'drawing' } : prev));
    });

    socket.on('winner.revealed', (data: { winner: Participant; giveaway: Giveaway }) => {
      setGiveaway(data.giveaway);
      setHistory((prev) => [data.giveaway, ...prev.filter((g) => g.id !== data.giveaway.id)]);
    });

    socket.on('giveaway.reset', () => {
      setGiveaway(null);
      setParticipants([]);
      setActiveDraw(null);
    });

    socket.on('kick.connection.changed', (state: KickBotState) => {
      setKickBot(state);
    });

    socket.on('overlay.settings.updated', (settings: OverlaySettings) => {
      setOverlaySettings(settings);
    });

    return () => {
      socket.disconnect();
    };
  }, [clientType, token]);

  const requestSync = useCallback(() => {
    socketRef.current?.emit('request.sync');
  }, []);

  return {
    connected,
    giveaway,
    participants,
    kickBot,
    overlaySettings,
    activeDraw,
    history,
    recentJoined,
    requestSync,
  };
}
