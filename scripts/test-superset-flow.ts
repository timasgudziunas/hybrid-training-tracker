/**
 * Tests for lib/workout-session/superset-flow.ts — the rule that decides
 * which superset partner to move to after a set is logged (owner's
 * definition, 2026-09-17: one set of the first exercise straight into one
 * set of the second, resting only after the round).
 *
 * Run with:
 *   npx tsx scripts/test-superset-flow.ts
 *
 * Exits non-zero on any failure.
 */

import { flattenTemplateSlots } from '../lib/workout-session/flatten-template-slots';
import { supersetMembers, slotNeedsWork, nextSupersetSlotKey } from '../lib/workout-session/superset-flow';
import type { ExerciseSlotLog, SetLog } from '../lib/workout-session/workout-session-types';
import type { TemplateSlot } from '../lib/workout-session/flatten-template-slots';
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

// One section: X (plain), A1/A2 (group A, 3 sets each), B1/B2 (group B, 3
// and 2 sets), Y (plain).
function makeSections(): WorkoutSection[] {
  return [
    {
      id: 'strength',
      name: 'Strength',
      order: 1,
      type: 'strength',
      exercises: [
        { exerciseId: 'x', order: 1, prescription: { type: 'repetitions', sets: 3, minReps: 5, maxReps: 8 } },
        {
          exerciseId: 'a1',
          order: 2,
          prescription: { type: 'repetitions', sets: 3, minReps: 5, maxReps: 8 },
          supersetGroup: 'A',
        },
        {
          exerciseId: 'a2',
          order: 3,
          prescription: { type: 'repetitions', sets: 3, minReps: 5, maxReps: 8 },
          supersetGroup: 'A',
        },
        {
          exerciseId: 'b1',
          order: 4,
          prescription: { type: 'repetitions', sets: 3, minReps: 5, maxReps: 8 },
          supersetGroup: 'B',
        },
        {
          exerciseId: 'b2',
          order: 5,
          prescription: { type: 'repetitions', sets: 2, minReps: 5, maxReps: 8 },
          supersetGroup: 'B',
        },
        { exerciseId: 'y', order: 6, prescription: { type: 'repetitions', sets: 3, minReps: 5, maxReps: 8 } },
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
const [X, A1, A2, B1, B2] = SLOTS.map((s) => s.slotKey);
const slotByKey = (key: string) => SLOTS.find((s) => s.slotKey === key)!;

function set(setNumber: number): SetLog {
  return { setNumber, completed: true, reps: 6 };
}

function slotLog(slotKey: string, overrides: Partial<ExerciseSlotLog> = {}): ExerciseSlotLog {
  return {
    slotKey,
    prescribedExerciseId: 'x',
    chosenExerciseId: 'x',
    status: 'upcoming',
    sets: [],
    ...overrides,
  };
}

function logs(entries: Record<string, ExerciseSlotLog>): Record<string, ExerciseSlotLog> {
  return entries;
}

// --- supersetMembers ---
check('members of A1 are [A1, A2]', supersetMembers(SLOTS, A1).map((s) => s.slotKey), [A1, A2]);
check('members of X are []', supersetMembers(SLOTS, X).map((s) => s.slotKey), []);

// --- nextSupersetSlotKey: A group, nothing logged ---
check('from A1 with nothing logged: next is A2', nextSupersetSlotKey(SLOTS, {}, A1), A2);

// --- nextSupersetSlotKey: A group, wraps from A2 back to A1 when A1 still needs work ---
{
  const slotLogs = logs({
    [A1]: slotLog(A1, { sets: [set(1)] }),
    [A2]: slotLog(A2, { sets: [set(1)] }),
  });
  check('from A2 with A2 at 1 set and A1 at 1 set: wraps to A1', nextSupersetSlotKey(SLOTS, slotLogs, A2), A1);
}

// --- nextSupersetSlotKey: A group, partner completed ---
{
  const slotLogs = logs({ [A2]: slotLog(A2, { status: 'completed', sets: [set(1), set(2), set(3)] }) });
  check('from A1 when A2 is completed: null', nextSupersetSlotKey(SLOTS, slotLogs, A1), null);
}

// --- nextSupersetSlotKey: A group, partner skipped ---
{
  const slotLogs = logs({ [A2]: slotLog(A2, { status: 'skipped' }) });
  check('from A1 when A2 is skipped: null', nextSupersetSlotKey(SLOTS, slotLogs, A1), null);
}

// --- nextSupersetSlotKey: B group, uneven set counts ---
{
  // B2's target is 2 (its own prescribed count); it already has both.
  const slotLogs = logs({ [B2]: slotLog(B2, { sets: [set(1), set(2)] }) });
  check('from B1 after B2 already has its target (2) sets: null', nextSupersetSlotKey(SLOTS, slotLogs, B1), null);
}
{
  const slotLogs = logs({
    [B1]: slotLog(B1, { sets: [set(1)] }),
    [B2]: slotLog(B2, { sets: [set(1), set(2)] }),
  });
  check('from B2 with B1 needing sets: B1', nextSupersetSlotKey(SLOTS, slotLogs, B2), B1);
}

// --- slotNeedsWork: qualitative member never needs work ---
{
  const qualitativeSlot: TemplateSlot = {
    slotKey: 'warmup:1',
    section: { id: 'warmup', name: 'Warmup', order: 0, type: 'warmup', exercises: [] },
    exercise: { exerciseId: 'q', order: 1, prescription: { type: 'qualitative', description: 'Dynamic warm-up' } },
  };
  check('qualitative member never needs work (no log)', slotNeedsWork(qualitativeSlot, undefined), false);
  check(
    'qualitative member never needs work (upcoming, no sets concept)',
    slotNeedsWork(qualitativeSlot, slotLog('warmup:1', { status: 'upcoming' })),
    false
  );
}

// --- slotNeedsWork: extraSets keeps a fully-logged slot needing work ---
{
  const fullyLoggedButExtra = slotLog(A1, { sets: [set(1), set(2), set(3)], extraSets: 1 });
  check('extraSets keeps a member needing work', slotNeedsWork(slotByKey(A1), fullyLoggedButExtra), true);
}

// --- slotNeedsWork: missing log entirely counts as needing work ---
check('missing slot log counts as needing work', slotNeedsWork(slotByKey(A1), undefined), true);

// --- slotNeedsWork: undecided "or" choice still needs work ---
{
  const undecided: ExerciseSlotLog = {
    slotKey: A1,
    prescribedExerciseId: 'a1',
    status: 'upcoming',
    sets: [],
  };
  check('undecided or choice still needs work', slotNeedsWork(slotByKey(A1), undecided), true);
}

// --- Groups in different sections with the same token are separate ---
{
  const sectionsWithSecondGroupA: WorkoutSection[] = [
    ...makeSections(),
    {
      id: 'core',
      name: 'Core',
      order: 2,
      type: 'core',
      exercises: [
        {
          exerciseId: 'c1',
          order: 1,
          prescription: { type: 'repetitions', sets: 3, minReps: 5, maxReps: 8 },
          supersetGroup: 'A',
        },
        {
          exerciseId: 'c2',
          order: 2,
          prescription: { type: 'repetitions', sets: 3, minReps: 5, maxReps: 8 },
          supersetGroup: 'A',
        },
      ],
    },
  ];
  const templateWithTwoSections: TrainingDayTemplate = { ...TEMPLATE, sections: sectionsWithSecondGroupA };
  const slotsWithTwoSections = flattenTemplateSlots(templateWithTwoSections);
  const strengthA1 = slotsWithTwoSections.find((s) => s.slotKey === A1)!.slotKey;
  check(
    'group A in the strength section does not pull in group A from core',
    supersetMembers(slotsWithTwoSections, strengthA1).map((s) => s.slotKey),
    [A1, A2]
  );
}

console.log('');
console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
