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

import type { Exercise, ExerciseCategory, Prescription } from './program-types';

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

/** Readouts the cardio card asks for at the end of a ride/row
 * (app/workout/active/cardio-entry-card.tsx), as library-facing labels. */
export const CARDIO_LOGGING_FIELD_LABELS = ['Time', 'Resistance', 'Avg watts', 'Avg speed', 'Distance'];

/**
 * Human labels for what gets logged per set for an exercise under a given
 * prescription (R10: the library shows "Logs: weight, reps, RIR" style
 * chips; the picker shows the same before an exercise is added). Mirrors
 * exactly what the entry cards render: repetitions come from
 * resolveRepetitionSetFields, holds/durations log seconds, cardio blocks
 * log the cardio readouts, distance reps log an optional time, and plain
 * qualitative blocks are a single mark-complete tap. `showRir` false drops
 * the RIR label (the athlete's RIR display setting, lib/settings).
 */
export function loggingFieldLabels(exercise: Exercise | undefined, prescription: Prescription, showRir = true): string[] {
  const isCardio = exercise?.category === 'cardio';
  switch (prescription.type) {
    case 'repetitions':
      return resolveRepetitionSetFields(exercise)
        .filter((field) => showRir || field.key !== 'rir')
        .map((field) => field.label);
    case 'hold':
      return ['Seconds held'];
    case 'duration':
      return isCardio ? CARDIO_LOGGING_FIELD_LABELS : ['Seconds'];
    case 'distance':
      return ['Time (optional)'];
    case 'qualitative':
      return isCardio ? CARDIO_LOGGING_FIELD_LABELS : ['Mark complete'];
  }
}

function formatRangeWords(min: number, max: number): string {
  return min === max ? `${min}` : `${min} to ${max}`;
}

/**
 * One-line preset summary for the library and pickers, e.g.
 * "3 sets of 8 to 12 reps", "3 holds of 20 to 40 sec", "10 to 20 min".
 * User-facing copy: ranges read "8 to 12", never "8-12" (NO DASHES rule).
 */
export function formatPrescriptionPreset(prescription: Prescription): string {
  switch (prescription.type) {
    case 'repetitions': {
      const perSide = prescription.perSide ? ' each side' : '';
      return `${prescription.sets} sets of ${formatRangeWords(prescription.minReps, prescription.maxReps)} reps${perSide}`;
    }
    case 'hold': {
      const perSide = prescription.perSide ? ' each side' : '';
      return `${prescription.sets} holds of ${formatRangeWords(prescription.minSeconds, prescription.maxSeconds)} sec${perSide}`;
    }
    case 'duration': {
      const perSide = prescription.perSide ? ' each side' : '';
      return `${prescription.sets} x ${formatRangeWords(prescription.minSeconds, prescription.maxSeconds)} sec${perSide}`;
    }
    case 'distance':
      return `${prescription.sets} x ${prescription.meters} m`;
    case 'qualitative': {
      const { approxMinMinutes: min, approxMaxMinutes: max } = prescription;
      if (min !== undefined && max !== undefined) return `${formatRangeWords(min, max)} min`;
      const only = min ?? max;
      return only !== undefined ? `${only} min` : prescription.description;
    }
  }
}
