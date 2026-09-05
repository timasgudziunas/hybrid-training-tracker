/**
 * Earliest-to-latest bodyweight comparison for the Review dashboard. Plain
 * arithmetic over logged check-ins, nothing inferred.
 */

export interface BodyweightChange {
  startWeight: number;
  endWeight: number;
  deltaLbs: number;
}

/** Earliest-to-latest bodyweight change within a set of points (order-
 * independent input). Requires at least two check-ins in the window. */
export function bodyweightChange(points: { date: string; weightLbs: number }[]): BodyweightChange | null {
  if (points.length < 2) return null;
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const start = sorted[0];
  const end = sorted[sorted.length - 1];
  return {
    startWeight: start.weightLbs,
    endWeight: end.weightLbs,
    deltaLbs: Math.round((end.weightLbs - start.weightLbs) * 10) / 10,
  };
}
