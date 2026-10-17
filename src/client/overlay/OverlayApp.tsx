import React, { useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket.js';
import { NameRoll } from './NameRollRoll.js';
import { WinnerCard } from './WinnerCard.js';
import { OverlayBadge } from './OverlayBadge.js';
import { api } from '../utils/api.js';

export const OverlayApp: React.FC = () => {
  const queryParams = new URLSearchParams(window.location.search);
  const token = queryParams.get('token') || undefined;

  const {
    connected,
    giveaway,
    overlaySettings,
    activeDraw,
    recentJoined,
  } = useSocket({ clientType: 'overlay', token });

  const [localCompletedWinner, setLocalCompletedWinner] = useState<any>(null);

  // Apply transparent overlay mode on mount
  useEffect(() => {
    document.documentElement.classList.add('overlay-mode');
    document.body.classList.add('overlay-mode');

    return () => {
      document.documentElement.classList.remove('overlay-mode');
      document.body.classList.remove('overlay-mode');
    };
  }, []);

  // When animation finishes in OBS, reveal the winner card
  const handleRollComplete = () => {
    if (activeDraw && giveaway) {
      setLocalCompletedWinner({
        winner: activeDraw.winner,
        giveaway: { ...giveaway, status: 'completed' },
      });
      // Streamer can also trigger auto-reveal from server, or client signals reveal
      api.revealWinner().catch(() => {});
    }
  };

  // Keep local winner synced if server already marked completed
  useEffect(() => {
    if (giveaway && giveaway.status === 'completed' && giveaway.winnerUsername) {
      setLocalCompletedWinner({
        winner: {
          id: giveaway.winnerId || 'winner',
          username: giveaway.winnerUsername,
          giveawayId: giveaway.id,
          kickUserId: '',
          joinedAt: '',
          status: 'active',
        },
        giveaway,
      });
    } else if (!giveaway || giveaway.status === 'draft') {
      setLocalCompletedWinner(null);
    }
  }, [giveaway]);

  return (
    <div
      className="min-h-screen w-full flex flex-col justify-center items-center bg-transparent p-6 select-none overflow-hidden"
      style={{
        transform: `scale(${overlaySettings.scale || 1})`,
        transformOrigin: 'center center',
      }}
    >
      {/* State 1: Active Draw Animation */}
      {giveaway && giveaway.status === 'drawing' && activeDraw ? (
        <div className="w-full max-w-5xl animate-fade-in">
          <NameRoll
            drawData={activeDraw}
            durationSec={overlaySettings.animationDurationSec}
            soundEnabled={overlaySettings.soundEnabled}
            soundVolume={overlaySettings.soundVolume}
            accentColor={overlaySettings.accentColor}
            onComplete={handleRollComplete}
          />
        </div>
      ) : giveaway && giveaway.status === 'completed' && localCompletedWinner ? (
        /* State 2: Winner Card Celebration */
        <div className="w-full max-w-xl animate-scale-in">
          <WinnerCard
            winner={localCompletedWinner.winner}
            giveaway={localCompletedWinner.giveaway}
            accentColor={overlaySettings.accentColor}
          />
        </div>
      ) : giveaway && (giveaway.status === 'open' || giveaway.status === 'closed') ? (
        /* State 3: Giveaway Live/Closed Badge */
        <div className="animate-fade-in">
          <OverlayBadge
            giveaway={giveaway}
            settings={overlaySettings}
            recentJoined={recentJoined}
          />
        </div>
      ) : (
        /* State 4: Idle / Standby (Transparent or tiny indicator during setup) */
        <div className="opacity-0 hover:opacity-10 transition-opacity text-[10px] text-neutral-600 font-mono">
          OBS Overlay Ready {connected ? '• Live' : '• Reconnecting...'}
        </div>
      )}
    </div>
  );
};
