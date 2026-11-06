/**
 * Tests for lib/workout-session/exercise-notes-log.ts (per-exercise notes
 * log, owner request 2026-11-06).
 *
 * Run with:
 *   npx tsx scripts/test-exercise-notes-log.ts
 *
 * Exits non-zero on any failure.
 */

import { extractExerciseNotes } from '../lib/workout-session/exercise-notes-log';
import type { ExerciseSlotLog } from '../lib/workout-session/workout-session-types';

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

function slot(key: string, chosenExerciseId: string | undefined, note?: string): ExerciseSlotLog {
  return {
    slotKey: key,
    prescribedExerciseId: chosenExerciseId ?? 'squat',
    chosenExerciseId,
    status: 'completed',
    sets: [],
    note,
  };
}

// Ordering: newest first, as given.
check(
  'ordering newest first',
  extractExerciseNotes(
    [
      { sessionDate: '2026-11-05', slots: { a: slot('a', 'squat', 'felt heavy') } },
      { sessionDate: '2026-10-29', slots: { a: slot('a', 'squat', 'felt light') } },
    ],
    ['squat']
  ),
  { squat: [{ date: '2026-11-05', note: 'felt heavy' }, { date: '2026-10-29', note: 'felt light' }] }
);

// Blank / whitespace / missing notes skipped; notes trimmed.
check(
  'blank notes skipped',
  extractExerciseNotes(
    [{ sessionDate: '2026-11-05', slots: { a: slot('a', 'squat', '   '), b: slot('b', 'squat', ''), c: slot('c', 'squat'), d: slot('d', 'squat', ' ok ') } }],
    ['squat']
  ),
  { squat: [{ date: '2026-11-05', note: 'ok' }] }
);

// Make-up date wins and re-sorts into place.
check(
  'make-up date wins',
  extractExerciseNotes(
    [
      { sessionDate: '2026-11-04', makeUpForDate: '2026-10-30', slots: { a: slot('a', 'squat', 'made up') } },
      { sessionDate: '2026-11-02', slots: { a: slot('a', 'squat', 'normal') } },
    ],
    ['squat']
  ),
  { squat: [{ date: '2026-11-02', note: 'normal' }, { date: '2026-10-30', note: 'made up' }] }
);

// Ids absent when empty; unrequested ids and undefined chosen ids ignored; null slots ok.
check(
  'absent ids and ignored slots',
  extractExerciseNotes(
    [
      { sessionDate: '2026-11-05', slots: { a: slot('a', 'row', 'x'), b: slot('b', undefined, 'y') } },
      { sessionDate: '2026-11-01', slots: null },
    ],
    ['squat']
  ),
  {}
);

// Two slots of the same exercise in one session both kept.
check(
  'two slots same exercise',
  extractExerciseNotes(
    [{ sessionDate: '2026-11-05', slots: { a: slot('a', 'squat', 'first'), b: slot('b', 'squat', 'second') } }],
    ['squat']
  ),
  { squat: [{ date: '2026-11-05', note: 'first' }, { date: '2026-11-05', note: 'second' }] }
);

console.log(`${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
