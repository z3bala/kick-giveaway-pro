/**
 * Wheel Odds and Weighted Prize Selection
 * Implements casino-style weighted probability:
 * "The higher the prize, the lower the chance is".
 */

export interface WheelSegmentOdd {
  segment: string;
  weight: number;
  percentage: number;
  formattedPercentage: string;
}

/**
 * Extracts a positive numeric value from a prize string like "1$", "$10", "25€", "50".
 */
export function extractNumericPrize(segment: string): number | null {
  if (!segment) return null;
  const match = segment.replace(/[^0-9.]/g, '');
  const val = parseFloat(match);
  return isNaN(val) || val <= 0 ? null : val;
}

/**
 * Calculates weighted odds for a list of wheel amounts.
 * If all segments have numeric values, weights are inversely proportional to their value:
 * weight = 1 / value
 * (e.g. 1$ = 1.0, 2$ = 0.5, 3$ = 0.33, 5$ = 0.2, 10$ = 0.1)
 *
 * If non-numeric strings are used, weights decrease by rank position:
 * weight = 1 / (index + 1)
 */
export function calculateWheelOdds(segments: string[]): WheelSegmentOdd[] {
  if (!segments || segments.length === 0) return [];
  if (segments.length === 1) {
    return [
      {
        segment: segments[0],
        weight: 1,
        percentage: 100,
        formattedPercentage: '100%',
      },
    ];
  }

  const numericValues = segments.map(extractNumericPrize);
  const allNumeric = numericValues.every((v) => v !== null);

  let rawWeights: number[];

  if (allNumeric) {
    // Inverse proportional weighting
    rawWeights = (numericValues as number[]).map((val) => 1 / val);
  } else {
    // Rank-based fallback
    rawWeights = segments.map((_, i) => 1 / (i + 1));
  }

  const totalWeight = rawWeights.reduce((acc, w) => acc + w, 0);

  return segments.map((segment, index) => {
    const weight = rawWeights[index];
    const percentage = Math.round((weight / totalWeight) * 1000) / 10;
    const rounded = Math.round(percentage);
    return {
      segment,
      weight,
      percentage,
      formattedPercentage: `${rounded}%`,
    };
  });
}

/**
 * Selects an index according to inverse-value weighted probability.
 * Supports passing a cryptographically secure random float [0, 1) or defaults to Math.random().
 */
export function pickWeightedWheelIndex(
  segments: string[],
  randomFraction?: number
): number {
  if (!segments || segments.length === 0) return 0;
  if (segments.length === 1) return 0;

  const odds = calculateWheelOdds(segments);
  const totalWeight = odds.reduce((acc, o) => acc + o.weight, 0);

  const rand =
    typeof randomFraction === 'number' && randomFraction >= 0 && randomFraction < 1
      ? randomFraction
      : Math.random();

  const targetWeight = rand * totalWeight;

  let cumulative = 0;
  for (let i = 0; i < odds.length; i++) {
    cumulative += odds[i].weight;
    if (targetWeight <= cumulative) {
      return i;
    }
  }

  return odds.length - 1;
}
