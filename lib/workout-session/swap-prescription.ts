/**
 * What a slot's prescription becomes when the athlete swaps in a different
 * exercise (R10, owner decision 2026-09-04, "presets feed Swap": the
 * swapped-in exercise brings its own logging fields instead of inheriting
 * the old ones).
 *
 * Rule, deterministic and shown nowhere else (owner decision 2026-11-06,
 * "preset sets, program range": a one-set warm-up swapped for an ordinary
 * exercise used to stay at one set):
 * - The substitute's defaultPrescription decides the SET COUNT whenever it
 *   has one.
 * - Same kind of set (e.g. reps for reps): the program's rep or hold range,
 *   per-side flag and everything else are kept as written; only the set
 *   count changes. Which inputs appear already follows the new exercise
 *   (lib/program/set-entry-fields.ts resolves by exercise).
 * - Different kind of set (e.g. a hold swapped in for a reps exercise):
 *   the substitute's defaultPrescription is adopted whole, its own set
 *   count included.
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
  if (preset.type === 'qualitative' || original.type === 'qualitative') {
    return preset.type === original.type ? original : preset;
  }
  if (preset.type !== original.type) return preset;
  // Same identity when nothing changes so swapChangesPrescription stays false.
  return preset.sets === original.sets ? original : { ...original, sets: preset.sets };
}

/** True when the swap actually changed the slot's prescription, i.e. the
 * SlotSubstitution should carry `originalPrescription` for revert. */
export function swapChangesPrescription(original: Prescription, substitute: Exercise): boolean {
  return prescriptionForSwap(original, substitute) !== original;
}
