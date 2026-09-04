/**
 * Tests for lib/workout-session/slot-set-edits.ts (removing/adding/deleting
 * sets during an active workout) and lib/program/set-entry-fields.ts
 * (per-exercise set input fields). Pre-registered assertions, in the style
 * of scripts/test-session-deviations.ts.
 *
 * Run with:
 *   npx tsx scripts/test-slot-set-edits.ts
 *
 * Exits non-zero on any failure.
 */

import {
  addExtraSet,
  deleteLoggedSet,
  removeCurrentSet,
  targetSetCount,
} from '../lib/workout-session/slot-set-edits';
import { resolveRepetitionSetFields } from '../lib/program/set-entry-fields';
import type { ExerciseSlotLog, SetLog } from '../lib/workout-session/workout-session-types';
import type { Exercise } from '../lib/program/program-types';

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

function setLog(setNumber: number, weight: number, reps: number): SetLog {
  return { setNumber, completed: true, weight, reps };
}

function slot(overrides: Partial<ExerciseSlotLog> = {}): ExerciseSlotLog {
  return {
    slotKey: 'strength-0',
    prescribedExerciseId: 'back-squat',
    status: 'upcoming',
    sets: [],
    ...overrides,
  };
}

function exercise(overrides: Partial<Exercise>): Exercise {
  return {
    id: 'back-squat',
    name: 'Back Squat',
    category: 'strength',
    primaryMuscles: [],
    secondaryMuscles: [],
    progressionType: 'none',
    ...overrides,
  };
}

// --- targetSetCount ---

check('targetSetCount: default (no extra/removed)', targetSetCount(4, slot()), 4);

check('targetSetCount: with extraSets', targetSetCount(4, slot({ extraSets: 2 })), 6);

check('targetSetCount: with removedSets', targetSetCount(4, slot({ removedSets: 1 })), 3);

check(
  'targetSetCount: extraSets and removedSets combine',
  targetSetCount(4, slot({ extraSets: 1, removedSets: 2 })),
  3
);

check(
  'targetSetCount: never below logged count',
  targetSetCount(2, slot({ removedSets: 5, sets: [setLog(1, 100, 8), setLog(2, 100, 8), setLog(3, 100, 8)] })),
  3
);

check('targetSetCount: never below 0', targetSetCount(1, slot({ removedSets: 10 })), 0);

// --- removeCurrentSet ---

{
  const withExtra = slot({ extraSets: 2, draft: { weight: '135', reps: '8' } });
  const result = removeCurrentSet(withExtra);
  check('removeCurrentSet: decrements extraSets first', result.extraSets, 1);
  check('removeCurrentSet: does not touch removedSets while extraSets > 0', result.removedSets, undefined);
}

{
  const noExtra = slot({ draft: { weight: '135', reps: '8' } });
  const result = removeCurrentSet(noExtra);
  check('removeCurrentSet: increments removedSets once extraSets is exhausted', result.removedSets, 1);
  check('removeCurrentSet: leaves extraSets alone at 0', result.extraSets, undefined);
}

{
  const withDraft = slot({ draft: { weight: '135', reps: '8', rir: 2 } });
  const result = removeCurrentSet(withDraft);
  check('removeCurrentSet: clears draft', result.draft, undefined);
}

{
  const loggedSets = [setLog(1, 100, 8), setLog(2, 100, 8)];
  const withLoggedSets = slot({ sets: loggedSets, extraSets: 1 });
  const result = removeCurrentSet(withLoggedSets);
  check('removeCurrentSet: never touches sets', result.sets, loggedSets);
}

// --- deleteLoggedSet ---

{
  const threeSets = slot({
    sets: [setLog(1, 100, 8), setLog(2, 110, 7), setLog(3, 120, 6)],
    extraSets: 1,
    removedSets: 2,
  });
  const result = deleteLoggedSet(threeSets, 2);
  check('deleteLoggedSet: removes the targeted set and renumbers remaining sets', result.sets, [
    { setNumber: 1, completed: true, weight: 100, reps: 8 },
    { setNumber: 2, completed: true, weight: 120, reps: 6 },
  ]);
  check('deleteLoggedSet: leaves extraSets unchanged', result.extraSets, 1);
  check('deleteLoggedSet: leaves removedSets unchanged', result.removedSets, 2);
}

{
  const oneSet = slot({ sets: [setLog(1, 100, 8)] });
  const result = deleteLoggedSet(oneSet, 1);
  check('deleteLoggedSet: deleting the only set leaves sets empty', result.sets, []);
}

{
  const twoSets = slot({ sets: [setLog(1, 100, 8), setLog(2, 110, 7)] });
  const result = deleteLoggedSet(twoSets, 9);
  check('deleteLoggedSet: missing set number is a no-op', result, twoSets);
}

// --- addExtraSet ---

{
  const withRemoved = slot({ removedSets: 2 });
  const result = addExtraSet(withRemoved);
  check('addExtraSet: undoes a removedSets first', result.removedSets, 1);
  check('addExtraSet: does not touch extraSets while undoing a removal', result.extraSets, undefined);
}

{
  const noRemoved = slot();
  const result = addExtraSet(noRemoved);
  check('addExtraSet: increments extraSets once removedSets is exhausted', result.extraSets, 1);
  check('addExtraSet: leaves removedSets alone at 0', result.removedSets, undefined);
}

// --- resolveRepetitionSetFields ---

check(
  'resolveRepetitionSetFields: box-jump exercise yields box height + reps, no weight/rir',
  resolveRepetitionSetFields(exercise({ id: 'box-jump', name: 'Box Jump', category: 'power' })).map((f) => f.key),
  ['boxHeightInches', 'reps']
);

check(
  'resolveRepetitionSetFields: power category exercise yields reps only',
  resolveRepetitionSetFields(exercise({ id: 'pogo-hop', name: 'Pogo Hop', category: 'power' })).map((f) => f.key),
  ['reps']
);

check(
  'resolveRepetitionSetFields: ordinary hypertrophy exercise yields weight, reps, rir',
  resolveRepetitionSetFields(exercise({ id: 'bench-press', name: 'Bench Press', category: 'hypertrophy' })).map(
    (f) => f.key
  ),
  ['weight', 'reps', 'rir']
);

check(
  'resolveRepetitionSetFields: undefined exercise yields the default',
  resolveRepetitionSetFields(undefined).map((f) => f.key),
  ['weight', 'reps', 'rir']
);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
