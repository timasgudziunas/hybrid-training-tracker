/**
 * Tests for lib/workout-session/group-superset-rows.ts.
 *
 * Run with:
 *   npx tsx scripts/test-group-superset-rows.ts
 *
 * Exits non-zero on any failure.
 */

import { groupSupersetRows } from '../lib/workout-session/group-superset-rows';
import type { TemplateSlot } from '../lib/workout-session/flatten-template-slots';
import type { WorkoutSection } from '../lib/program/program-types';

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

const section: WorkoutSection = { id: 's', name: 'S', order: 1, type: 'strength', exercises: [] };

function slot(id: string, group?: string): TemplateSlot {
  return {
    slotKey: id,
    section,
    exercise: {
      exerciseId: id,
      order: 1,
      prescription: { type: 'repetitions', sets: 3, minReps: 5, maxReps: 8 },
      ...(group ? { supersetGroup: group } : {}),
    },
  };
}

// Compact shape: "x" for a single, "A:a1+a2" for a group.
function shape(slots: TemplateSlot[]): string[] {
  return groupSupersetRows(slots).map((row) =>
    row.kind === 'single' ? row.slot.slotKey : `${row.token}:${row.slots.map((s) => s.slotKey).join('+')}`
  );
}

check('empty', shape([]), []);
check('no supersets', shape([slot('x'), slot('y')]), ['x', 'y']);
check('one pair', shape([slot('a1', 'A'), slot('a2', 'A')]), ['A:a1+a2']);
check(
  'two groups with plain rows between',
  shape([slot('x'), slot('a1', 'A'), slot('a2', 'A'), slot('m'), slot('b1', 'B'), slot('b2', 'B'), slot('y')]),
  ['x', 'A:a1+a2', 'm', 'B:b1+b2', 'y']
);
check('three members', shape([slot('a1', 'A'), slot('a2', 'A'), slot('a3', 'A')]), ['A:a1+a2+a3']);
check(
  'same letter not adjacent stays separate',
  shape([slot('a1', 'A'), slot('a2', 'A'), slot('m'), slot('a3', 'A'), slot('a4', 'A')]),
  ['A:a1+a2', 'm', 'A:a3+a4']
);
check(
  'adjacent different letters split',
  shape([slot('a1', 'A'), slot('a2', 'A'), slot('b1', 'B'), slot('b2', 'B')]),
  ['A:a1+a2', 'B:b1+b2']
);

console.log(`${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
