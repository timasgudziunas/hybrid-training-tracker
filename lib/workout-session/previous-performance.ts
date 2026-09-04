/**
 * Pure extraction for "previous performance" (PRODUCT_SPEC §7), scoped to a
 * set of exercise ids rather than a single day template (2026-09-04
 * rework): the owner pointed out that doing an exercise on a different day
 * than usual still deserves its "last time" numbers. The caller
 * (app/workout/actions.ts) fetches a recent window of sessions across ALL
 * templates and hands the rows here, newest first, to pick the most recent
 * logged sets per exercise id.
 */

import type { ExerciseSlotLog, PreviousPerformanceByExercise, SetLog } from './workout-session-types';

/**
 * `rows` must already be sorted newest first (by session date, then start
 * time). For each id in `exerciseIds`, returns the sets from the first
 * (newest) row whose performance slots contain a slot that was actually
 * chosen (`chosenExerciseId` set) as that exercise AND logged at least one
 * set. A slot with zero sets is skipped in favor of an older row that has
 * some, rather than being treated as "no history." Ids with no history in
 * any scanned row are simply absent from the result.
 */
export function extractPreviousPerformance(
  rows: Array<{ slots: Record<string, ExerciseSlotLog> | null | undefined }>,
  exerciseIds: string[]
): PreviousPerformanceByExercise {
  const result: PreviousPerformanceByExercise = {};
  const remaining = new Set(exerciseIds);

  for (const row of rows) {
    if (remaining.size === 0) break;
    if (!row.slots) continue;

    for (const slot of Object.values(row.slots)) {
      if (!slot.chosenExerciseId || !remaining.has(slot.chosenExerciseId)) continue;

      const sets = slot.sets.filter((set): set is SetLog => Boolean(set));
      if (sets.length === 0) continue;

      result[slot.chosenExerciseId] = sets;
      remaining.delete(slot.chosenExerciseId);
    }
  }

  return result;
}
