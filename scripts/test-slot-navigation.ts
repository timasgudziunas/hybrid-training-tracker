/**
 * Tests for lib/workout-session/flatten-template-slots.ts's
 * nextUnfinishedSlotKey — the rule that decides where "Next"/skip lands
 * (owner: finishing an exercise out of order and clicking Next must skip
 * exercises already done, and the LAST slot must go to the overview rather
 * than straight to Finish if anything else is still upcoming).
 *
 * Run with:
 *   npx tsx scripts/test-slot-navigation.ts
 *
 * Exits non-zero on any failure.
 */

import { flattenTemplateSlots, nextUnfinishedSlotKey } from '../lib/workout-session/flatten-template-slots';
import type { ExerciseSlotLog } from '../lib/workout-session/workout-session-types';
import type { TrainingDayTemplate, WorkoutSection } from '../lib/program/program-types';

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

// Four slots in one section, in order: a, b, c, d.
function makeSections(): WorkoutSection[] {
  return [
    {
      id: 'strength',
      name: 'Strength',
      order: 1,
      type: 'strength',
      exercises: [
        { exerciseId: 'a', order: 1, prescription: { type: 'repetitions', sets: 3, minReps: 5, maxReps: 8 } },
        { exerciseId: 'b', order: 2, prescription: { type: 'repetitions', sets: 3, minReps: 5, maxReps: 8 } },
        { exerciseId: 'c', order: 3, prescription: { type: 'repetitions', sets: 3, minReps: 5, maxReps: 8 } },
        { exerciseId: 'd', order: 4, prescription: { type: 'repetitions', sets: 3, minReps: 5, maxReps: 8 } },
      ],
    },
  ];
}

const TEMPLATE: TrainingDayTemplate = {
  restDay: false,
  id: 'wednesday',
  weekday: 'wednesday',
  name: 'Test Day',
  ultimatePracticeLater: false,
  sections: makeSections(),
};

const SLOTS = flattenTemplateSlots(TEMPLATE);
// slotKeys: strength:1 (a), strength:2 (b), strength:3 (c), strength:4 (d)
const [A, B, C, D] = SLOTS.map((s) => s.slotKey);

function slotLog(slotKey: string, status: ExerciseSlotLog['status']): ExerciseSlotLog {
  return {
    slotKey,
    prescribedExerciseId: 'x',
    chosenExerciseId: 'x',
    status,
    sets: [],
  };
}

function logs(entries: Record<string, ExerciseSlotLog['status']>): Record<string, ExerciseSlotLog> {
  const result: Record<string, ExerciseSlotLog> = {};
  for (const [key, status] of Object.entries(entries)) {
    result[key] = slotLog(key, status);
  }
  return result;
}

// --- Normal next: everything else upcoming ---
{
  const result = nextUnfinishedSlotKey(SLOTS, logs({ [A]: 'completed', [B]: 'upcoming', [C]: 'upcoming', [D]: 'upcoming' }), A);
  check('normal next: next is the immediately following slot', result.next, B);
  check('normal next: remainingElsewhere holds the rest, in order', result.remainingElsewhere, [C, D]);
}

// --- Skipping a completed slot in between ---
{
  const result = nextUnfinishedSlotKey(SLOTS, logs({ [A]: 'completed', [B]: 'completed', [C]: 'upcoming', [D]: 'upcoming' }), A);
  check('skip a completed slot in between: next is the first upcoming past it', result.next, C);
  check('skip a completed slot in between: remainingElsewhere', result.remainingElsewhere, [D]);
}

// --- Skipping a skipped slot in between ---
{
  const result = nextUnfinishedSlotKey(SLOTS, logs({ [A]: 'completed', [B]: 'skipped', [C]: 'upcoming', [D]: 'upcoming' }), A);
  check('skip a skipped slot in between: next is the first upcoming past it', result.next, C);
  check('skip a skipped slot in between: the skipped slot (nothing logged) still counts as not done', result.remainingElsewhere, [B, D]);
}

// --- A skipped slot WITH logged work is done enough: not surfaced again ---
{
  const slotLogs = logs({ [A]: 'completed', [B]: 'skipped', [C]: 'upcoming', [D]: 'upcoming' });
  slotLogs[B] = { ...slotLogs[B], sets: [{ setNumber: 1, completed: true, reps: 8 }] };
  const result = nextUnfinishedSlotKey(SLOTS, slotLogs, A);
  check('skipped slot with logged sets: next still the first upcoming', result.next, C);
  check('skipped slot with logged sets: excluded from remainingElsewhere', result.remainingElsewhere, [D]);
}

// --- After the last exercise, a skipped earlier slot brings up the overview ---
{
  const result = nextUnfinishedSlotKey(SLOTS, logs({ [A]: 'completed', [B]: 'skipped', [C]: 'completed', [D]: 'completed' }), D);
  check('last slot, earlier skipped: next is null', result.next, null);
  check('last slot, earlier skipped (no work): surfaces it', result.remainingElsewhere, [B]);
}

// --- Last slot with an earlier upcoming one: next is null, that earlier one surfaces ---
{
  const result = nextUnfinishedSlotKey(SLOTS, logs({ [A]: 'upcoming', [B]: 'completed', [C]: 'completed', [D]: 'completed' }), D);
  check('last slot, earlier upcoming: next is null (nothing after D)', result.next, null);
  check('last slot, earlier upcoming: remainingElsewhere surfaces the earlier one', result.remainingElsewhere, [A]);
}

// --- All done: next null, remainingElsewhere empty ---
{
  const result = nextUnfinishedSlotKey(SLOTS, logs({ [A]: 'completed', [B]: 'completed', [C]: 'completed', [D]: 'completed' }), D);
  check('all done: next is null', result.next, null);
  check('all done: remainingElsewhere is empty', result.remainingElsewhere, []);
}

// --- A slot missing from slotLogs counts as upcoming ---
{
  // B has no entry at all in slotLogs (should not normally happen — every
  // session slot starts upcoming per create-session.ts — but the function
  // must still treat a missing entry as not-done rather than throwing or
  // silently skipping it).
  const result = nextUnfinishedSlotKey(SLOTS, logs({ [A]: 'completed', [C]: 'completed', [D]: 'completed' }), A);
  check('missing slotLog entry counts as upcoming: next finds it', result.next, B);
  check('missing slotLog entry counts as upcoming: remainingElsewhere empty', result.remainingElsewhere, []);
}

console.log('');
console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
