import { describe, it, expect } from 'vitest';
import { calculateWheelOdds, pickWeightedWheelIndex, extractNumericPrize } from '../../src/shared/wheelOdds.js';

describe('Wheel Odds and Weighted Prize Selection', () => {
  it('extracts numeric values accurately from prize strings', () => {
    expect(extractNumericPrize('1$')).toBe(1);
    expect(extractNumericPrize('$10')).toBe(10);
    expect(extractNumericPrize('25.50$')).toBe(25.5);
    expect(extractNumericPrize('Prize 500')).toBe(500);
    expect(extractNumericPrize('NoNumbersHere')).toBeNull();
  });

  it('calculates weighted odds where higher prizes have lower chances', () => {
    const segments = ['1$', '2$', '3$', '5$', '10$'];
    const odds = calculateWheelOdds(segments);

    expect(odds).toHaveLength(5);

    // Verify strictly descending percentages as prize values ascend
    for (let i = 0; i < odds.length - 1; i++) {
      expect(odds[i].percentage).toBeGreaterThan(odds[i + 1].percentage);
    }

    // 1$ should have the highest chance (~44%)
    expect(odds[0].percentage).toBeGreaterThan(40);
    // 10$ should have the lowest chance (~4%)
    expect(odds[4].percentage).toBeLessThan(6);
    expect(odds[4].percentage).toBeGreaterThan(2);

    // Sum of percentages should be approximately 100%
    const total = odds.reduce((sum, o) => sum + o.percentage, 0);
    expect(total).toBeGreaterThanOrEqual(99.5);
    expect(total).toBeLessThanOrEqual(100.5);
  });

  it('statistically verifies multi-run rolls produce lower frequency for higher prizes', () => {
    const segments = ['1$', '2$', '3$', '5$', '10$'];
    const counts = [0, 0, 0, 0, 0];
    const RUNS = 10000;

    for (let i = 0; i < RUNS; i++) {
      const idx = pickWeightedWheelIndex(segments);
      counts[idx]++;
    }

    // 1$ should be chosen more than 2$
    expect(counts[0]).toBeGreaterThan(counts[1]);
    // 2$ should be chosen more than 3$
    expect(counts[1]).toBeGreaterThan(counts[2]);
    // 3$ should be chosen more than 5$
    expect(counts[2]).toBeGreaterThan(counts[3]);
    // 5$ should be chosen more than 10$
    expect(counts[3]).toBeGreaterThan(counts[4]);

    // 10$ should still be won at least once (e.g. > 100 times out of 10000)
    expect(counts[4]).toBeGreaterThan(150);
  });

  it('handles edge cases gracefully', () => {
    expect(pickWeightedWheelIndex([])).toBe(0);
    expect(pickWeightedWheelIndex(['5$'])).toBe(0);
    expect(calculateWheelOdds([])).toEqual([]);
    expect(calculateWheelOdds(['10$'])[0].percentage).toBe(100);
  });
});
