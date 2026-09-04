/**
 * Pure computation of the "fun stats" shown on the completion summary
 * (PRODUCT_SPEC §6): total tonnage, total sprint distance, total hold time,
 * plus the plain completion counts. Takes data in, returns data out — no
 * side effects, per CLAUDE.md's "shared logic is pure" convention.
 */

import type { TemplateSlot } from './flatten-template-slots';
import { isCardioSet } from './cardio-slot';
import type { CompletionStats, WorkoutSessionPerformance } from './workout-session-types';

export function computeCompletionStats(
  performance: WorkoutSessionPerformance,
  templateSlots: TemplateSlot[]
): CompletionStats {
  const slotByKey = new Map(templateSlots.map((slot) => [slot.slotKey, slot]));

  let totalTonnage = 0;
  let totalSprintDistanceMeters = 0;
  let totalHoldSeconds = 0;
  let totalCardioSeconds = 0;
  let exercisesCompleted = 0;
  let exercisesSkipped = 0;
  let setsCompleted = 0;

  for (const slotLog of Object.values(performance.slots)) {
    // A skipped exercise still counts any sets logged before the skip —
    // work done is work done.
    if (slotLog.status === 'skipped') {
      exercisesSkipped += 1;
    }
    if (slotLog.status === 'completed') {
      exercisesCompleted += 1;
    }

    const templateSlot = slotByKey.get(slotLog.slotKey);
    const prescription = templateSlot?.exercise.prescription;

    for (const set of slotLog.sets) {
      if (!set.completed) continue;
      setsCompleted += 1;

      if (prescription?.type === 'repetitions' && set.weight !== undefined && set.reps !== undefined) {
        totalTonnage += set.weight * set.reps;
      }
      // A cardio set (see cardio-slot.ts) counts toward totalCardioSeconds
      // only, never totalHoldSeconds, even when its nominal prescription
      // type is 'duration' — a rowing-machine block and a plain isometric
      // hold both use `duration`/`hold` types, but they are different
      // metrics to the athlete.
      if (set.seconds !== undefined && isCardioSet(set, prescription?.type)) {
        totalCardioSeconds += set.seconds;
      } else if ((prescription?.type === 'hold' || prescription?.type === 'duration') && set.seconds !== undefined) {
        totalHoldSeconds += set.seconds;
      }
      if (prescription?.type === 'distance' && set.distanceCompleted) {
        totalSprintDistanceMeters += prescription.meters;
      }
    }

    if (slotLog.qualitativeCompleted) {
      setsCompleted += 1;
    }
  }

  return {
    totalTonnage,
    totalSprintDistanceMeters,
    totalHoldSeconds,
    totalCardioSeconds,
    exercisesCompleted,
    exercisesSkipped,
    setsCompleted,
  };
}
