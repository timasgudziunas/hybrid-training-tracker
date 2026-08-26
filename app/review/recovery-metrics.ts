/**
 * Small, plain arithmetic helpers for the Review dashboard's recovery and
 * bodyweight sections. Deliberately not physiologically precise (CLAUDE.md
 * non-negotiable 19, PRODUCT_SPEC §13): these are averages and earliest-to-
 * latest comparisons over logged data, nothing inferred.
 */

/** Plain arithmetic mean, or null when there is nothing to average — never
 * a silently-misleading 0. */
export function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export type GroinTrendDirection = "rising" | "falling" | "stable";

/**
 * Compares the earliest to the latest groin-status entry with a non-null
 * value in `entries` (order-independent input; sorted here). Requires at
 * least two dated readings — otherwise there is nothing to trend. A plain
 * numeric comparison, not a diagnosis.
 */
export function groinTrendDirection(
  entries: { date: string; groinStatus: number | null }[]
): GroinTrendDirection | null {
  const withStatus = entries.filter(
    (entry): entry is { date: string; groinStatus: number } => entry.groinStatus !== null
  );
  if (withStatus.length < 2) return null;

  const sorted = [...withStatus].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0].groinStatus;
  const last = sorted[sorted.length - 1].groinStatus;

  if (last > first) return "rising";
  if (last < first) return "falling";
  return "stable";
}

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
