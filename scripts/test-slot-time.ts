/**
 * Tests for lib/workout-session/slot-time.ts — the per-slot "time on this
 * exercise" bookkeeping that survives leaving and returning to an exercise
 * (owner: "when I click off of an exercise and come back, I want it to save
 * the time I spent on it. Right now it resets back to zero and starts
 * counting again").
 *
 * Run with:
 *   npx tsx scripts/test-slot-time.ts
 *
 * Exits non-zero on any failure.
 */

import { slotElapsedSeconds, transitionCurrentSlot } from '../lib/workout-session/slot-time';
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

function makeSlot(slotKey: string, extra: Partial<ExerciseSlotLog> = {}): ExerciseSlotLog {
  return {
    slotKey,
    prescribedExerciseId: 'x',
    chosenExerciseId: 'x',
    status: 'upcoming',
    sets: [],
    ...extra,
  };
}

const T0 = new Date('2026-09-17T10:00:00.000Z').getTime();
function iso(offsetMs: number): string {
  return new Date(T0 + offsetMs).toISOString();
}

// --- Open a slot: from null, to A ---
{
  const slots = { A: makeSlot('A') };
  const next = transitionCurrentSlot(slots, null, 'A', iso(0));
  check('open a slot: enteredAt is stamped', next.A.enteredAt, iso(0));
  check('open a slot: activeSeconds untouched', next.A.activeSeconds, undefined);
  check('open a slot: original slots object not mutated', slots.A.enteredAt, undefined);
  check('open a slot: a new record is returned', next !== slots, true);
}

// --- Leave it 90s later: A to null ---
{
  const slots = { A: makeSlot('A', { enteredAt: iso(0) }) };
  const next = transitionCurrentSlot(slots, 'A', null, iso(90_000));
  check('leave after 90s: activeSeconds accumulates', next.A.activeSeconds, 90);
  check('leave after 90s: enteredAt cleared', next.A.enteredAt, undefined);
  check('leave after 90s: original slot object not mutated', slots.A.enteredAt, iso(0));
}

// --- Return 30s later, then leave after another 15s: accumulates to 105 ---
{
  // After the 90s stint above: activeSeconds 90, no enteredAt. Return at
  // +30s (t=120s from T0).
  const afterFirstStint = { A: makeSlot('A', { activeSeconds: 90 }) };
  const reopened = transitionCurrentSlot(afterFirstStint, null, 'A', iso(120_000));
  check('return 30s later: enteredAt stamped at the return time', reopened.A.enteredAt, iso(120_000));
  check('return 30s later: activeSeconds untouched by the reopen itself', reopened.A.activeSeconds, 90);

  // Leave again 15s after returning (t=135s from T0).
  const closedAgain = transitionCurrentSlot(reopened, 'A', null, iso(135_000));
  check('leave after 15 more seconds: activeSeconds is 90 + 15 = 105', closedAgain.A.activeSeconds, 105);
  check('leave after 15 more seconds: enteredAt cleared again', closedAgain.A.enteredAt, undefined);
}

// --- Transitioning into a slot that already has enteredAt keeps it (resumed session) ---
{
  const slots = { B: makeSlot('B', { enteredAt: iso(0) }) };
  const next = transitionCurrentSlot(slots, null, 'B', iso(999_000));
  check('resumed slot keeps its original enteredAt', next.B.enteredAt, iso(0));
  check('no-op transition returns the same reference', next, slots);
}

// --- from and to both null: no-op ---
{
  const slots = { A: makeSlot('A', { enteredAt: iso(0) }) };
  const next = transitionCurrentSlot(slots, null, null, iso(10_000));
  check('from and to both null: same reference returned', next, slots);
}

// --- from === to: no-op even if the slot has an open stint ---
{
  const slots = { A: makeSlot('A', { enteredAt: iso(0) }) };
  const next = transitionCurrentSlot(slots, 'A', 'A', iso(10_000));
  check('from === to: same reference returned, enteredAt untouched', next, slots);
}

// --- Missing slot ids are handled without throwing ---
{
  const slots = { A: makeSlot('A', { enteredAt: iso(0) }) };
  const next = transitionCurrentSlot(slots, 'missing-from', 'missing-to', iso(10_000));
  check('missing from/to slot ids: no crash, slots unchanged', next, slots);
}

// --- Negative span (clock skew) clamps to 0 ---
{
  // enteredAt is AFTER the "now" passed to the leave transition.
  const slots = { A: makeSlot('A', { enteredAt: iso(10_000) }) };
  const next = transitionCurrentSlot(slots, 'A', null, iso(0));
  check('negative span on leave clamps to 0', next.A.activeSeconds, 0);
}

// --- slotElapsedSeconds: idle slot (no enteredAt) ---
{
  const slot = makeSlot('A', { activeSeconds: 50 });
  check('slotElapsedSeconds idle: just activeSeconds', slotElapsedSeconds(slot, T0 + 999_000), 50);
}

// --- slotElapsedSeconds: live slot (open stint counts too) ---
{
  const slot = makeSlot('A', { activeSeconds: 50, enteredAt: iso(0) });
  check('slotElapsedSeconds live: base plus live span', slotElapsedSeconds(slot, T0 + 20_000), 70);
}

// --- slotElapsedSeconds: negative live span clamps to 0 ---
{
  const slot = makeSlot('A', { activeSeconds: 50, enteredAt: iso(10_000) });
  check('slotElapsedSeconds live, clock skew: clamps to 0', slotElapsedSeconds(slot, T0), 50);
}

// --- slotElapsedSeconds: undefined slot ---
{
  check('slotElapsedSeconds undefined slot: 0', slotElapsedSeconds(undefined, T0), 0);
}

console.log('');
console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
