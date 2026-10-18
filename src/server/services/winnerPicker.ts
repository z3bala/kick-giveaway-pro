import crypto from 'node:crypto';
import type { Participant, DrawAnimationData, DrawRollCard } from '../../shared/types.js';
import { pickWeightedWheelIndex } from '../../shared/wheelOdds.js';

export interface WinnerSelectionResult {
  winner: Participant;
  drawData: DrawAnimationData;
}

export interface WheelDrawConfig {
  enabled?: boolean;
  segments?: string[];
  durationSec?: number;
}

/**
 * Selects a winner with zero modulo bias using Node.js crypto.randomInt
 * and prepares deterministic animation cards for the CS-style horizontal roll
 * and optional half-wheel prize selector.
 */
export function selectWinnerUniformly(
  giveawayId: string,
  eligibleParticipants: Participant[],
  durationSec: number = 7.5,
  wheelConfig?: WheelDrawConfig
): WinnerSelectionResult {
  if (!eligibleParticipants || eligibleParticipants.length === 0) {
    throw new Error('Cannot select a winner from an empty participant list.');
  }

  const eligibleCount = eligibleParticipants.length;

  // crypto.randomInt(min, max) produces uniform integers in [min, max) with zero modulo bias
  const winningIndex = crypto.randomInt(0, eligibleCount);
  const winner = eligibleParticipants[winningIndex];

  // Optional prize wheel selection
  let wheelEnabled = false;
  let wheelSegments: string[] | undefined;
  let rolledPrize: string | undefined;
  let wheelTargetIndex: number | undefined;
  let wheelDurationSec: number | undefined;

  if (wheelConfig?.enabled && wheelConfig.segments && wheelConfig.segments.length > 0) {
    wheelEnabled = true;
    wheelSegments = wheelConfig.segments;
    // Weighted selection: "the higher the prize the lower the chance is"
    // Generate uniform cryptographic float [0, 1) with zero modulo bias
    const cryptoRand = crypto.randomBytes(4).readUInt32BE(0) / 0x100000000;
    wheelTargetIndex = pickWeightedWheelIndex(wheelSegments, cryptoRand);
    rolledPrize = wheelSegments[wheelTargetIndex];
    wheelDurationSec = wheelConfig.durationSec || 4.2;
  }

  // Build the horizontal roll cards strip.
  // Standard CS-style roll typically contains ~55-65 cards, with target stopping around index 48-52.
  const TOTAL_ROLL_CARDS = 60;
  const TARGET_INDEX = 48; // The center indicator stops exactly on this card

  const rollCards: DrawRollCard[] = [];

  for (let i = 0; i < TOTAL_ROLL_CARDS; i++) {
    if (i === TARGET_INDEX) {
      rollCards.push({
        id: `card-win-${winner.id}`,
        username: winner.username,
        isWinner: true,
        avatarSeed: getAvatarSeed(winner.username),
      });
    } else {
      // Pick a random participant from the snapshot to populate the strip
      const sampleIdx = crypto.randomInt(0, eligibleCount);
      const participant = eligibleParticipants[sampleIdx];
      rollCards.push({
        id: `card-${i}-${participant.id}`,
        username: participant.username,
        isWinner: false,
        avatarSeed: getAvatarSeed(participant.username + i),
      });
    }
  }

  const drawData: DrawAnimationData = {
    giveawayId,
    winner,
    rollCards,
    targetIndex: TARGET_INDEX,
    durationSec,
    startedAt: Date.now(),
    wheelEnabled,
    wheelSegments,
    rolledPrize,
    wheelTargetIndex,
    wheelDurationSec,
  };

  return {
    winner,
    drawData,
  };
}

function getAvatarSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
