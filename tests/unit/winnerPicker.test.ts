import { describe, it, expect } from 'vitest';
import { selectWinnerUniformly } from '../../src/server/services/winnerPicker.js';
import type { Participant } from '../../src/shared/types.js';

describe('Winner Selection Integrity (Cryptographic Zero Modulo Bias)', () => {
  const mockParticipants: Participant[] = [
    { id: 'p1', giveawayId: 'gw1', kickUserId: 'u1', username: 'GamerOne', joinedAt: '2026-10-17T12:00:00Z', status: 'active' },
    { id: 'p2', giveawayId: 'gw1', kickUserId: 'u2', username: 'KickViewer', joinedAt: '2026-10-17T12:01:00Z', status: 'active' },
    { id: 'p3', giveawayId: 'gw1', kickUserId: 'u3', username: 'StreamSniper', joinedAt: '2026-10-17T12:02:00Z', status: 'active' },
    { id: 'p4', giveawayId: 'gw1', kickUserId: 'u4', username: 'LuckyCharm', joinedAt: '2026-10-17T12:03:00Z', status: 'active' },
  ];

  it('throws an error if the participant list is empty', () => {
    expect(() => selectWinnerUniformly('gw1', [])).toThrow(
      'Cannot select a winner from an empty participant list.'
    );
  });

  it('selects an eligible winner from the provided participant snapshot', () => {
    const { winner, drawData } = selectWinnerUniformly('gw1', mockParticipants, 7.5);

    expect(winner).toBeDefined();
    expect(mockParticipants.some((p) => p.id === winner.id)).toBe(true);
    expect(drawData.giveawayId).toBe('gw1');
    expect(drawData.winner.id).toBe(winner.id);
  });

  it('places the preselected winner exactly at the target index on the roll strip', () => {
    const { winner, drawData } = selectWinnerUniformly('gw1', mockParticipants, 8);

    expect(drawData.targetIndex).toBe(48);
    expect(drawData.rollCards.length).toBe(60);

    const winningCard = drawData.rollCards[drawData.targetIndex];
    expect(winningCard.isWinner).toBe(true);
    expect(winningCard.username).toBe(winner.username);
  });

  it('ensures all non-target cards have isWinner set to false', () => {
    const { drawData } = selectWinnerUniformly('gw1', mockParticipants);

    drawData.rollCards.forEach((card, idx) => {
      if (idx !== drawData.targetIndex) {
        expect(card.isWinner).toBe(false);
      }
    });
  });

  it('demonstrates fair multi-run distribution across all participants', () => {
    const counts: Record<string, number> = { GamerOne: 0, KickViewer: 0, StreamSniper: 0, LuckyCharm: 0 };
    const runs = 200;

    for (let i = 0; i < runs; i++) {
      const { winner } = selectWinnerUniformly('gw1', mockParticipants);
      counts[winner.username] += 1;
    }

    // Every participant should be selected at least once over 200 runs
    Object.values(counts).forEach((count) => {
      expect(count).toBeGreaterThan(10);
    });
  });
});
