/**
 * What a slot's prescription becomes when the athlete swaps in a different
 * exercise (R10, owner decision 2026-09-04, "presets feed Swap": the
 * swapped-in exercise brings its own logging fields instead of inheriting
 * the old ones).
 *
 * Rule, deterministic and shown nowhere else:
 * - Same kind of set (e.g. reps for reps): the program's prescription is
 *   kept as written. Which inputs appear already follows the new exercise
 *   (lib/program/set-entry-fields.ts resolves by exercise), so nothing
 *   needs to change.
 * - Different kind of set (e.g. a hold swapped in for a reps exercise):
 *   the substitute's defaultPrescription is adopted, keeping the program's
 *   set count when both sides have one, since the program author decided
 *   the volume and the preset only knows how the exercise is logged.
 * - Substitute without a preset: the original prescription is kept.
 *
 * Pure; the active-workout screen writes the result into the session's own
 * templateSnapshot and records the original on the SlotSubstitution so a
 * revert can restore it.
 */

import type { Exercise, Prescription } from '@/lib/program/program-types';

export function prescriptionForSwap(original: Prescription, substitute: Exercise): Prescription {
  const preset = substitute.defaultPrescription;
  if (!preset) return original;
  if (preset.type === original.type) return original;
  if (preset.type !== 'qualitative' && original.type !== 'qualitative') {
    return { ...preset, sets: original.sets };
  }
  return preset;
}

/** True when the swap actually changed the slot's prescription, i.e. the
 * SlotSubstitution should carry `originalPrescription` for revert. */
export function swapChangesPrescription(original: Prescription, substitute: Exercise): boolean {
  return prescriptionForSwap(original, substitute) !== original;
}
