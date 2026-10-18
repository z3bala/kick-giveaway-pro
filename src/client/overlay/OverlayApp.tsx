import React, { useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket.js';
import { NameRoll } from './NameRollRoll.js';
import { WinnerCard } from './WinnerCard.js';
import { OverlayBadge } from './OverlayBadge.js';
import { GtbOverlayCard } from './GtbOverlayCard.js';
import { api } from '../utils/api.js';

export const OverlayApp: React.FC = () => {
  const queryParams = new URLSearchParams(window.location.search);
  const token = queryParams.get('token') || undefined;
  const overlayType = queryParams.get('type') || undefined; // 'gtb' or standard

  const {
    connected,
    giveaway,
    overlaySettings,
    activeDraw,
    recentJoined,
    gtbEvent,
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
        giveaway: {
          ...giveaway,
          prize: activeDraw.rolledPrize || giveaway.prize,
          status: 'completed',
        },
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

  // Position & origin mapping for streamer arrangement
  const getPositionConfig = (pos: string = 'top-right') => {
    switch (pos) {
      case 'top-left':
        return {
          classes: 'top-6 left-6 items-start justify-start',
          origin: 'top left',
        };
      case 'top-center':
        return {
          classes: 'top-6 inset-x-0 items-center justify-center',
          origin: 'top center',
        };
      case 'top-right':
        return {
          classes: 'top-6 right-6 items-end justify-start',
          origin: 'top right',
        };
      case 'bottom-left':
        return {
          classes: 'bottom-6 left-6 items-start justify-end',
          origin: 'bottom left',
        };
      case 'bottom-center':
        return {
          classes: 'bottom-6 inset-x-0 items-center justify-center',
          origin: 'bottom center',
        };
      case 'bottom-right':
        return {
          classes: 'bottom-6 right-6 items-end justify-end',
          origin: 'bottom right',
        };
      case 'center':
      default:
        return {
          classes: 'inset-0 items-center justify-center',
          origin: 'center center',
        };
    }
  };

  const posConfig = getPositionConfig(overlaySettings.position || 'top-right');
  const scale = overlaySettings.scale || 1;

  return (
    <div className="fixed inset-0 w-full h-full bg-transparent select-none overflow-hidden pointer-events-none">
      {/* State 1: Active CS2 Roulette Draw Animation (Centered with cinematic backdrop) */}
      {giveaway && giveaway.status === 'drawing' && activeDraw ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-[2px] animate-fade-in pointer-events-auto">
          <div
            className="w-full max-w-5xl"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
            }}
          >
            <NameRoll
              drawData={activeDraw}
              durationSec={overlaySettings.animationDurationSec}
              soundEnabled={overlaySettings.soundEnabled}
              soundVolume={overlaySettings.soundVolume}
              accentColor={overlaySettings.accentColor}
              onComplete={handleRollComplete}
            />
          </div>
        </div>
      ) : giveaway && giveaway.status === 'completed' && localCompletedWinner ? (
        /* State 2: Minimalist Streamer Winner Banner (Middle Bottom Centered, zero game obstruction) */
        <div className="fixed inset-x-0 bottom-10 z-50 flex items-center justify-center pointer-events-none animate-fade-in">
          <div
            className="pointer-events-auto flex items-center justify-center"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'bottom center',
            }}
          >
            <WinnerCard
              winner={localCompletedWinner.winner}
              giveaway={localCompletedWinner.giveaway}
              accentColor={overlaySettings.accentColor}
            />
          </div>
        </div>
      ) : giveaway && (giveaway.status === 'open' || giveaway.status === 'closed') ? (
        /* State 3: Giveaway Live/Closed Badge (Arranged at Streamer's chosen screen position) */
        <div className={`fixed z-30 flex pointer-events-none ${posConfig.classes}`}>
          <div
            className="flex flex-col pointer-events-auto"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: posConfig.origin,
            }}
          >
            <OverlayBadge
              giveaway={giveaway}
              settings={overlaySettings}
              recentJoined={recentJoined}
            />
          </div>
        </div>
      ) : gtbEvent && (gtbEvent.status === 'open' || gtbEvent.status === 'closed') ? (
        /* State 4: Guess The Balance Live Banner */
        <div className={`fixed z-30 flex pointer-events-none ${posConfig.classes}`}>
          <div
            className="flex flex-col pointer-events-auto"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: posConfig.origin,
            }}
          >
            <GtbOverlayCard gtbEvent={gtbEvent} settings={overlaySettings} />
          </div>
        </div>
      ) : gtbEvent && gtbEvent.status === 'resolved' ? (
        /* State 5: Guess The Balance Winner Announcement */
        <div className="fixed inset-x-0 bottom-10 z-50 flex items-center justify-center pointer-events-none animate-fade-in">
          <div
            className="pointer-events-auto flex items-center justify-center"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'bottom center',
            }}
          >
            <GtbOverlayCard gtbEvent={gtbEvent} settings={overlaySettings} />
          </div>
        </div>
      ) : (
        /* State 6: Idle / Standby (Transparent on stream) */
        <div className="absolute bottom-3 right-3 opacity-0 hover:opacity-20 transition-opacity text-[10px] text-neutral-500 font-mono">
          OBS Overlay Connected • Standby
        </div>
      )}
    </div>
  );
};
