/**
 * Tests for lib/workout-session/add-exercise.ts (adding a library exercise
 * to a session mid-workout) and lib/workout-session/swap-prescription.ts
 * (which prescription a swapped-in exercise gets). Pre-registered
 * assertions in the style of scripts/test-slot-set-edits.ts.
 *
 * Run with:
 *   npx tsx scripts/test-add-exercise.ts
 *
 * Exits non-zero on any failure.
 */

import { ADDED_SECTION_ID, FALLBACK_PRESCRIPTION, addExerciseToSession } from '../lib/workout-session/add-exercise';
import { prescriptionForSwap, swapChangesPrescription } from '../lib/workout-session/swap-prescription';
import { flattenTemplateSlots, isSlotNotDone } from '../lib/workout-session/flatten-template-slots';
import { detectSessionDeviations } from '../lib/workout-session/session-deviations';
import type { Exercise, Prescription, TrainingDayTemplate } from '../lib/program/program-types';
import type { WorkoutSessionRecord } from '../lib/workout-session/workout-session-types';

let passed = 0;
let failed = 0;

function check(name: string, actual: unknown, expected: unknown): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passed += 1;
  } else {
    failed += 1;
    console.log(`FAIL: ${name} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
  }
}

function exercise(id: string, overrides: Partial<Exercise> = {}): Exercise {
  return {
    id,
    name: id,
    category: 'hypertrophy',
    primaryMuscles: [],
    secondaryMuscles: [],
    progressionType: 'double-progression',
    ...overrides,
  };
}

const REPS_3X8: Prescription = { type: 'repetitions', sets: 3, minReps: 8, maxReps: 12 };
const HOLD_4X20: Prescription = { type: 'hold', sets: 4, minSeconds: 20, maxSeconds: 40 };
const CARDIO_10MIN: Prescription = { type: 'qualitative', description: 'Easy cycling.', approxMinMinutes: 10, approxMaxMinutes: 15 };

const template: TrainingDayTemplate = {
  restDay: false,
  id: 'monday',
  weekday: 'monday',
  name: 'Upper',
  ultimatePracticeLater: false,
  sections: [
    {
      id: 'strength',
      name: 'Strength',
      order: 1,
      type: 'strength',
      exercises: [{ exerciseId: 'hack-squat', order: 1, prescription: REPS_3X8 }],
    },
  ],
};

function session(): WorkoutSessionRecord {
  return {
    id: 'session-1',
    sessionDate: '2026-09-04',
    weekday: 'monday',
    workoutTemplateId: 'monday',
    startedAt: '2026-09-04T10:00:00.000Z',
    completedAt: null,
    status: 'active',
    durationSeconds: null,
    notes: null,
    sessionDifficulty: null,
    performance: {
      slots: {
        'strength:1': { slotKey: 'strength:1', prescribedExerciseId: 'hack-squat', chosenExerciseId: 'hack-squat', status: 'completed', sets: [1, 2, 3].map((setNumber) => ({ setNumber, completed: true, weight: 100, reps: 10 })) },
      },
      currentSlotKey: null,
      templateSnapshot: template,
      exercisesSnapshot: { 'hack-squat': exercise('hack-squat') },
    },
  };
}

// --- addExerciseToSession ---
{
  const facePull = exercise('face-pull', { defaultPrescription: { type: 'repetitions', sets: 3, minReps: 12, maxReps: 15 } });
  const { record, slotKey } = addExerciseToSession(session(), facePull);

  check('slot key lives in the added section', slotKey, `${ADDED_SECTION_ID}:1`);
  check('current slot moves to the added exercise', record.performance.currentSlotKey, slotKey);
  check('added section appended after existing sections', record.performance.templateSnapshot.sections.map((s) => s.id), ['strength', ADDED_SECTION_ID]);
  check('added section is optional', record.performance.templateSnapshot.sections[1].optional, true);
  check('added section order follows the last section', record.performance.templateSnapshot.sections[1].order, 2);
  check('prescription comes from the preset', record.performance.templateSnapshot.sections[1].exercises[0].prescription, facePull.defaultPrescription);
  check('exercise injected into the snapshot', Boolean(record.performance.exercisesSnapshot['face-pull']), true);
  check('slot log created upcoming with the exercise chosen', record.performance.slots[slotKey], {
    slotKey,
    prescribedExerciseId: 'face-pull',
    chosenExerciseId: 'face-pull',
    status: 'upcoming',
    sets: [],
  });
  check('added slot key recorded', record.performance.modifications?.addedSlotKeys, [slotKey]);
  check('flattened slots include the added one last', flattenTemplateSlots(record.performance.templateSnapshot).map((s) => s.slotKey), ['strength:1', slotKey]);
  check('original record untouched', session().performance.templateSnapshot.sections.length, 1);

  // A second add reuses the section and increments the order.
  const second = addExerciseToSession(record, exercise('cable-curl'));
  check('second add goes into the same section', second.record.performance.templateSnapshot.sections.length, 2);
  check('second add gets the next order', second.slotKey, `${ADDED_SECTION_ID}:2`);
  check('second add without a preset gets the fallback', second.record.performance.templateSnapshot.sections[1].exercises[1].prescription, FALLBACK_PRESCRIPTION);
  check('both added keys recorded in order', second.record.performance.modifications?.addedSlotKeys, [slotKey, second.slotKey]);

  // Skipping or leaving an added exercise is never a deviation.
  const slots = flattenTemplateSlots(second.record.performance.templateSnapshot);
  const skipped = {
    ...second.record.performance,
    slots: {
      ...second.record.performance.slots,
      [slotKey]: { ...second.record.performance.slots[slotKey], status: 'skipped' as const },
    },
  };
  check('skipped added exercise is not a deviation', detectSessionDeviations(skipped, slots), []);
  check('upcoming added exercise is not a deviation', detectSessionDeviations(second.record.performance, slots), []);
  check('but it still counts as not done for the overview', isSlotNotDone(second.record.performance.slots[second.slotKey]), true);
}

// --- prescriptionForSwap ---
{
  const noPreset = exercise('no-preset');
  const repsPreset = exercise('reps-preset', { defaultPrescription: { type: 'repetitions', sets: 4, minReps: 6, maxReps: 8 } });
  const holdPreset = exercise('hold-preset', { defaultPrescription: HOLD_4X20 });
  const cardioPreset = exercise('cardio-preset', { category: 'cardio', defaultPrescription: CARDIO_10MIN });

  check('no preset keeps the original', prescriptionForSwap(REPS_3X8, noPreset), REPS_3X8);
  check('same type keeps the original (program volume wins)', prescriptionForSwap(REPS_3X8, repsPreset), REPS_3X8);
  check('different type adopts the preset with the original set count', prescriptionForSwap(REPS_3X8, holdPreset), { ...HOLD_4X20, sets: 3 });
  check('qualitative preset adopted as is', prescriptionForSwap(REPS_3X8, cardioPreset), CARDIO_10MIN);
  check('qualitative original swapped to reps takes the preset as is', prescriptionForSwap(CARDIO_10MIN, repsPreset), repsPreset.defaultPrescription);
  check('swapChangesPrescription false for same type', swapChangesPrescription(REPS_3X8, repsPreset), false);
  check('swapChangesPrescription true for different type', swapChangesPrescription(REPS_3X8, holdPreset), true);
  check('swapChangesPrescription false without preset', swapChangesPrescription(REPS_3X8, noPreset), false);
}

console.log(`${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
