/**
 * Tests for lib/workout-session/previous-performance.ts — the 2026-09-04
 * rework that scopes "previous performance" to an exercise id across ALL
 * days, not just the last run of the same weekday template. Pre-registered
 * assertions, in the style of scripts/test-session-deviations.ts.
 *
 * Run with:
 *   npx tsx scripts/test-previous-performance.ts
 *
 * Exits non-zero on any failure.
 */

import { extractPreviousPerformance } from '../lib/workout-session/previous-performance';
import type { ExerciseSlotLog, SetLog } from '../lib/workout-session/workout-session-types';

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

function set(weight: number): SetLog {
  return { setNumber: 1, completed: true, weight, reps: 8 };
}

function slot(chosenExerciseId: string | undefined, sets: SetLog[]): ExerciseSlotLog {
  return {
    slotKey: `slot:${chosenExerciseId ?? 'unset'}`,
    prescribedExerciseId: chosenExerciseId ?? 'squat',
    chosenExerciseId,
    status: 'completed',
    sets,
  };
}

// --- Newest row wins ---
{
  const rows = [
    { slots: { a: slot('calf-raise', [set(100)]) } }, // newest
    { slots: { a: slot('calf-raise', [set(80)]) } }, // older
  ];
  const result = extractPreviousPerformance(rows, ['calf-raise']);
  check('newest row wins', result['calf-raise'], [set(100)]);
}

// --- An older row supplies an exercise the newest lacks ---
{
  const rows = [
    { slots: { a: slot('squat', [set(200)]) } }, // newest: only squat
    { slots: { a: slot('calf-raise', [set(80)]) } }, // older: has calf-raise
  ];
  const result = extractPreviousPerformance(rows, ['squat', 'calf-raise']);
  check('older row supplies exercise newest lacks: squat', result['squat'], [set(200)]);
  check('older row supplies exercise newest lacks: calf-raise', result['calf-raise'], [set(80)]);
}

// --- An exercise never done is absent ---
{
  const rows = [{ slots: { a: slot('squat', [set(200)]) } }];
  const result = extractPreviousPerformance(rows, ['squat', 'never-done']);
  check('never-done exercise is absent', 'never-done' in result, false);
}

// --- A slot with zero sets is skipped in favor of an older row with sets ---
{
  const rows = [
    { slots: { a: slot('calf-raise', []) } }, // newest: chosen but no sets
    { slots: { a: slot('calf-raise', [set(80)]) } }, // older: has sets
  ];
  const result = extractPreviousPerformance(rows, ['calf-raise']);
  check('zero-set newest row is skipped in favor of older row with sets', result['calf-raise'], [set(80)]);
}

// --- A null slots row is tolerated ---
{
  const rows = [
    { slots: null },
    { slots: { a: slot('calf-raise', [set(80)]) } },
  ];
  const result = extractPreviousPerformance(rows, ['calf-raise']);
  check('null slots row is tolerated', result['calf-raise'], [set(80)]);
}

// --- Empty ids yields {} ---
{
  const rows = [{ slots: { a: slot('calf-raise', [set(80)]) } }];
  const result = extractPreviousPerformance(rows, []);
  check('empty exerciseIds yields {}', result, {});
}

// --- A slot with no chosenExerciseId is ignored ---
{
  const rows = [{ slots: { a: slot(undefined, [set(80)]) } }];
  const result = extractPreviousPerformance(rows, ['squat']);
  check('slot with no chosenExerciseId is ignored', result, {});
}

console.log('');
console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
