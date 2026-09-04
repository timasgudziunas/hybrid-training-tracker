/**
 * Which inputs a repetitions-type set shows, per exercise (owner request
 * 2026-09-04: "for some of the exercises like box jump there should be
 * different fields such as height of the box"). Config, not code: adding a
 * field to an exercise is a one-line entry here, never a branch in the
 * entry card.
 *
 * Resolution order (first match wins), see resolveRepetitionSetFields:
 *   1. an exact exercise-id override (ids are slugified names, so
 *      "Box Jump" in any pasted program resolves to `box-jump`),
 *   2. a category override (e.g. every `power` exercise drops weight/RIR,
 *      since jumps are quality work, not load work),
 *   3. the default: weight, reps, RIR.
 *
 * The keys map 1:1 onto SetLog / SetDraft fields in
 * lib/workout-session/workout-session-types.ts. `reps` is always present
 * for a repetitions prescription and is never removable through this
 * config.
 */

import type { Exercise, ExerciseCategory } from './program-types';

export type RepetitionSetFieldKey = 'weight' | 'reps' | 'rir' | 'boxHeightInches' | 'jumpDistanceInches';

export interface RepetitionSetFieldSpec {
  key: RepetitionSetFieldKey;
  /** Input label as shown above the field, unit included. */
  label: string;
  /** Short unit suffix used when formatting a logged set, e.g. "in". Empty
   * for reps and RIR, which format themselves. */
  unit: string;
  inputMode: 'decimal' | 'numeric';
}

export const WEIGHT_FIELD: RepetitionSetFieldSpec = { key: 'weight', label: 'Weight (lb)', unit: 'lb', inputMode: 'decimal' };
export const REPS_FIELD: RepetitionSetFieldSpec = { key: 'reps', label: 'Reps', unit: '', inputMode: 'numeric' };
export const RIR_FIELD: RepetitionSetFieldSpec = { key: 'rir', label: 'RIR', unit: '', inputMode: 'numeric' };
export const BOX_HEIGHT_FIELD: RepetitionSetFieldSpec = {
  key: 'boxHeightInches',
  label: 'Box height (in)',
  unit: 'in',
  inputMode: 'decimal',
};
export const JUMP_DISTANCE_FIELD: RepetitionSetFieldSpec = {
  key: 'jumpDistanceInches',
  label: 'Distance (in)',
  unit: 'in',
  inputMode: 'decimal',
};

export const DEFAULT_REPETITION_SET_FIELDS: RepetitionSetFieldSpec[] = [WEIGHT_FIELD, REPS_FIELD, RIR_FIELD];

/** Per-exercise overrides, keyed by exercise id (slugified name). */
export const REPETITION_SET_FIELDS_BY_EXERCISE_ID: Record<string, RepetitionSetFieldSpec[]> = {
  'box-jump': [BOX_HEIGHT_FIELD, REPS_FIELD],
  'depth-jump': [BOX_HEIGHT_FIELD, REPS_FIELD],
  'standing-broad-jump': [JUMP_DISTANCE_FIELD, REPS_FIELD],
  'broad-jump': [JUMP_DISTANCE_FIELD, REPS_FIELD],
};

/** Per-category overrides, applied when no exercise-id override matches. */
export const REPETITION_SET_FIELDS_BY_CATEGORY: Partial<Record<ExerciseCategory, RepetitionSetFieldSpec[]>> = {
  // Jumps, bounds, pogos: reps and quality, never load or RIR
  // (TRAINING_SYSTEM.md: power work never chases fatigue).
  power: [REPS_FIELD],
  // Sprint-family drills that were written as reps rather than distance.
  speed: [REPS_FIELD],
};

export function resolveRepetitionSetFields(exercise: Exercise | undefined): RepetitionSetFieldSpec[] {
  if (!exercise) return DEFAULT_REPETITION_SET_FIELDS;
  const byId = REPETITION_SET_FIELDS_BY_EXERCISE_ID[exercise.id];
  if (byId) return byId;
  const byCategory = REPETITION_SET_FIELDS_BY_CATEGORY[exercise.category];
  if (byCategory) return byCategory;
  return DEFAULT_REPETITION_SET_FIELDS;
}

export function hasRepetitionSetField(fields: RepetitionSetFieldSpec[], key: RepetitionSetFieldKey): boolean {
  return fields.some((field) => field.key === key);
}
