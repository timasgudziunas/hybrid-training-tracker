/**
 * Pure helpers for editing an ExerciseSlotLog's set count and logged sets
 * during an active workout (2026-09-04 rework, owner complaints: "removing
 * a set removes the previous one, not the one I'm filling in", "no option
 * to remove a set", "can't delete a set after saving it").
 *
 * Three distinct operations, kept deliberately separate rather than one
 * "remove" function with a mode flag:
 *   - removeCurrentSet: shrinks the TARGET (the not-yet-logged set the
 *     athlete is currently on). Never touches `sets`.
 *   - deleteLoggedSet: removes an already-saved set and renumbers the rest.
 *     Leaves the target unchanged, so the athlete gets to redo that set.
 *   - addExtraSet: grows the target, undoing a prior removeCurrentSet first
 *     if there's one to undo.
 *
 * No side effects, no React — the active-workout screen owns wiring these
 * into slot state updates and re-saves.
 */

import type { ExerciseSlotLog } from './workout-session-types';

/** Target set count for a slot = prescribed + extraSets - removedSets,
 * never below 0 and never below the number of sets already logged (a
 * deletion elsewhere or a stale removedSets value must never make the
 * target smaller than what's actually been recorded). */
export function targetSetCount(prescribedSets: number, slot: ExerciseSlotLog): number {
  const configured = prescribedSets + (slot.extraSets ?? 0) - (slot.removedSets ?? 0);
  return Math.max(slot.sets.length, configured, 0);
}

/** Removes the CURRENT, not-yet-logged set: clears the in-progress draft
 * and shrinks the target by one (undoing an extra set first if one is
 * outstanding, otherwise recording a removal). Callers only offer this when
 * `slot.sets.length < targetSetCount(...)` — there must be a current set to
 * remove. Never touches `sets`. */
export function removeCurrentSet(slot: ExerciseSlotLog): ExerciseSlotLog {
  const extraSets = slot.extraSets ?? 0;
  if (extraSets > 0) {
    return { ...slot, draft: undefined, extraSets: extraSets - 1 };
  }
  const removedSets = slot.removedSets ?? 0;
  return { ...slot, draft: undefined, removedSets: removedSets + 1 };
}

/** Removes one already-logged set by its set number and renumbers the
 * remaining sets 1..n in order. `extraSets`/`removedSets` are left alone,
 * so the target count is unchanged and the athlete gets to redo that set.
 * A missing set number is a no-op (returns the same slot). */
export function deleteLoggedSet(slot: ExerciseSlotLog, setNumber: number): ExerciseSlotLog {
  const index = slot.sets.findIndex((set) => set.setNumber === setNumber);
  if (index === -1) return slot;

  const remaining = slot.sets.filter((_, i) => i !== index);
  const renumbered = remaining.map((set, i) => ({ ...set, setNumber: i + 1 }));
  return { ...slot, sets: renumbered };
}

/** Grows the target by one via "+ Add set": undoes a prior removeCurrentSet
 * first if there's one outstanding, otherwise records a genuine extra set. */
export function addExtraSet(slot: ExerciseSlotLog): ExerciseSlotLog {
  const removedSets = slot.removedSets ?? 0;
  if (removedSets > 0) {
    return { ...slot, removedSets: removedSets - 1 };
  }
  const extraSets = slot.extraSets ?? 0;
  return { ...slot, extraSets: extraSets + 1 };
}
