/**
 * Tests for lib/workout-session/session-deviations.ts — the Phase 5 rule
 * that decides which deviations get shown to the athlete before Finish, and
 * therefore whether a session saves as 'completed' or 'modified'
 * (resolveFinishStatus). Pre-registered assertions, in the style of
 * scripts/test-save-queue.ts.
 *
 * Run with:
 *   npx tsx scripts/test-session-deviations.ts
 *
 * Exits non-zero on any failure.
 */

import { detectSessionDeviations, resolveFinishStatus, type SessionDeviation } from '../lib/workout-session/session-deviations';
import { flattenTemplateSlots } from '../lib/workout-session/flatten-template-slots';
import type {
  ExerciseSlotLog,
  SetLog,
  WorkoutSessionPerformance,
} from '../lib/workout-session/workout-session-types';
import type { Exercise, TrainingDayTemplate, WorkoutSection } from '../lib/program/program-types';

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

function exercise(id: string, name: string): Exercise {
  return {
    id,
    name,
    category: 'strength',
    primaryMuscles: [],
    secondaryMuscles: [],
    progressionType: 'none',
  };
}

// One template: two non-optional sections (strength, calisthenics) each with
// one repetitions slot, plus one optional section (cardio) with one
// qualitative slot. Covers non-optional skip/not-done, sets-based reduction,
// and the optional-section exclusion rule in a single small fixture.
function makeSections(): WorkoutSection[] {
  return [
    {
      id: 'strength',
      name: 'Strength',
      order: 1,
      type: 'strength',
      exercises: [
        {
          exerciseId: 'squat',
          order: 1,
          prescription: { type: 'repetitions', sets: 3, minReps: 5, maxReps: 8 },
        },
      ],
    },
    {
      id: 'calisthenics',
      name: 'Calisthenics',
      order: 2,
      type: 'calisthenics',
      exercises: [
        {
          exerciseId: 'pull-up',
          order: 1,
          prescription: { type: 'repetitions', sets: 3, minReps: 5, maxReps: 8 },
        },
      ],
    },
    {
      id: 'cardio',
      name: 'Zone 2',
      order: 3,
      type: 'cardio',
      optional: true,
      exercises: [
        {
          exerciseId: 'zone-2',
          order: 1,
          prescription: { type: 'qualitative', description: 'Easy pace, 20 minutes.' },
        },
      ],
    },
  ];
}

function makeTemplate(): TrainingDayTemplate {
  return {
    restDay: false,
    id: 'wednesday',
    weekday: 'wednesday',
    name: 'Test Day',
    ultimatePracticeLater: false,
    sections: makeSections(),
  };
}

const TEMPLATE = makeTemplate();
const TEMPLATE_SLOTS = flattenTemplateSlots(TEMPLATE);
const EXERCISES: Record<string, Exercise> = {
  squat: exercise('squat', 'Back Squat'),
  'pull-up': exercise('pull-up', 'Pull Up'),
  'zone-2': exercise('zone-2', 'Zone 2 Cardio'),
  'goblet-squat': exercise('goblet-squat', 'Goblet Squat'),
};

function completedSet(setNumber: number): SetLog {
  return { setNumber, completed: true, weight: 100, reps: 6, rir: 2 };
}

function makeSlot(slotKey: string, overrides: Partial<ExerciseSlotLog> = {}): ExerciseSlotLog {
  const prescribedExerciseId = TEMPLATE_SLOTS.find((s) => s.slotKey === slotKey)!.exercise.exerciseId;
  return {
    slotKey,
    prescribedExerciseId,
    chosenExerciseId: prescribedExerciseId,
    status: 'upcoming',
    sets: [],
    ...overrides,
  };
}

function fullyCompletedSlots(): Record<string, ExerciseSlotLog> {
  return {
    'strength:1': makeSlot('strength:1', {
      status: 'completed',
      sets: [completedSet(1), completedSet(2), completedSet(3)],
    }),
    'calisthenics:1': makeSlot('calisthenics:1', {
      status: 'completed',
      sets: [completedSet(1), completedSet(2), completedSet(3)],
    }),
    'cardio:1': makeSlot('cardio:1', { status: 'completed', qualitativeCompleted: true }),
  };
}

function makePerformance(overrides: Partial<WorkoutSessionPerformance> = {}): WorkoutSessionPerformance {
  return {
    slots: fullyCompletedSlots(),
    currentSlotKey: null,
    templateSnapshot: TEMPLATE,
    exercisesSnapshot: EXERCISES,
    ...overrides,
  };
}

function kinds(deviations: SessionDeviation[]): string[] {
  return deviations.map((d) => d.kind);
}

// --- Clean full session ---
{
  const performance = makePerformance();
  const deviations = detectSessionDeviations(performance, TEMPLATE_SLOTS);
  check('clean full session: zero deviations', deviations.length, 0);
  check('clean full session: resolveFinishStatus completed', resolveFinishStatus(deviations), 'completed');
}

// --- Skipped non-optional slot ---
{
  const slots = fullyCompletedSlots();
  slots['calisthenics:1'] = makeSlot('calisthenics:1', { status: 'skipped' });
  const performance = makePerformance({ slots });
  const deviations = detectSessionDeviations(performance, TEMPLATE_SLOTS);
  check('skipped non-optional slot: one skipped-exercise deviation', kinds(deviations), ['skipped-exercise']);
  check('skipped non-optional slot: label names the exercise', deviations[0].label, 'Skipped: Pull Up');
  check('skipped non-optional slot: status modified', resolveFinishStatus(deviations), 'modified');
}

// --- Skipped OPTIONAL-section slot ---
{
  const slots = fullyCompletedSlots();
  slots['cardio:1'] = makeSlot('cardio:1', { status: 'skipped' });
  const performance = makePerformance({ slots });
  const deviations = detectSessionDeviations(performance, TEMPLATE_SLOTS);
  check('skipped optional-section slot: zero deviations', deviations.length, 0);
}

// --- Upcoming (not-done) non-optional slot ---
{
  const slots = fullyCompletedSlots();
  slots['strength:1'] = makeSlot('strength:1', { status: 'upcoming' });
  const performance = makePerformance({ slots });
  const deviations = detectSessionDeviations(performance, TEMPLATE_SLOTS);
  check('upcoming non-optional slot: one not-done deviation', kinds(deviations), ['not-done']);
  check('upcoming non-optional slot: label names the exercise', deviations[0].label, 'Not done: Back Squat');
}

// --- Reduced sets: 2 of 3 completed ---
{
  const slots = fullyCompletedSlots();
  slots['strength:1'] = makeSlot('strength:1', {
    status: 'completed',
    sets: [completedSet(1), { setNumber: 2, completed: false }, completedSet(3)],
  });
  const performance = makePerformance({ slots });
  const deviations = detectSessionDeviations(performance, TEMPLATE_SLOTS);
  check('reduced sets: one reduced-sets deviation (set 2 not completed does not count)', kinds(deviations), ['reduced-sets']);
  check('reduced sets: label shows 2 of 3', deviations[0].label, 'Fewer sets: Back Squat, 2 of 3');
  check('reduced sets: status modified', resolveFinishStatus(deviations), 'modified');
}

// --- extraSets does not mask a reduction ---
{
  const slots = fullyCompletedSlots();
  slots['strength:1'] = makeSlot('strength:1', {
    status: 'completed',
    extraSets: 2,
    sets: [completedSet(1), completedSet(2), completedSet(3), completedSet(4), completedSet(5)],
  });
  const performance = makePerformance({ slots });
  const deviations = detectSessionDeviations(performance, TEMPLATE_SLOTS);
  check('3 prescribed + extras all completed: no deviation', deviations.length, 0);
}

// --- Qualitative slot exempt from reduced-sets logic ---
{
  // Fully completed baseline already includes a completed qualitative slot
  // with no sets at all; confirmed zero deviations above. Explicitly assert
  // the qualitative slot alone produces nothing even though it has 0 sets
  // against no numeric prescription.
  const performance = makePerformance();
  const deviations = detectSessionDeviations(performance, TEMPLATE_SLOTS);
  check('qualitative completed slot: contributes no reduced-sets deviation', deviations.some((d) => d.slotKey === 'cardio:1'), false);
}

// --- reducedLoadSlotKeys -> reduced-load ---
{
  const performance = makePerformance({ modifications: { reducedLoadSlotKeys: ['strength:1'] } });
  const deviations = detectSessionDeviations(performance, TEMPLATE_SLOTS);
  check('reducedLoadSlotKeys: one reduced-load deviation', kinds(deviations), ['reduced-load']);
  check('reducedLoadSlotKeys: label names the exercise', deviations[0].label, 'Went lighter: Back Squat');
}

// --- substitution -> substituted-exercise ---
{
  const performance = makePerformance({
    modifications: {
      substitutions: [{ slotKey: 'strength:1', fromExerciseId: 'squat', toExerciseId: 'goblet-squat' }],
    },
  });
  const deviations = detectSessionDeviations(performance, TEMPLATE_SLOTS);
  check('substitution: one substituted-exercise deviation', kinds(deviations), ['substituted-exercise']);
  check(
    'substitution: label includes both names',
    deviations[0].label.includes('Goblet Squat') && deviations[0].label.includes('Back Squat'),
    true
  );
}

// --- recoveryMode -> recovery-mode ---
{
  const performance = makePerformance({ modifications: { recoveryMode: true } });
  const deviations = detectSessionDeviations(performance, TEMPLATE_SLOTS);
  check('recoveryMode: one recovery-mode deviation', kinds(deviations), ['recovery-mode']);
  check('recoveryMode: label', deviations[0].label, 'Converted to a recovery session');
}

// --- endedEarly folds zero-work skipped/upcoming into ONE deviation ---
{
  const slots: Record<string, ExerciseSlotLog> = {
    'strength:1': makeSlot('strength:1', { status: 'skipped' }), // zero work
    'calisthenics:1': makeSlot('calisthenics:1', {
      status: 'skipped',
      sets: [completedSet(1)], // partial work before the skip
    }),
    'cardio:1': makeSlot('cardio:1', { status: 'upcoming' }), // optional, excluded entirely
  };
  const performance = makePerformance({ slots, modifications: { endedEarly: true, endedEarlyReason: 'time' } });
  const deviations = detectSessionDeviations(performance, TEMPLATE_SLOTS);
  check('endedEarly: exactly ended-early + the one partial-work skip', kinds(deviations).sort(), ['ended-early', 'skipped-exercise'].sort());
  const endedEarly = deviations.find((d) => d.kind === 'ended-early')!;
  check('endedEarly: count is 2 non-optional slots not done', endedEarly.label, 'Ended early, 2 exercises not done');
  const skipped = deviations.find((d) => d.kind === 'skipped-exercise')!;
  check('endedEarly: the partial-work skip is still listed individually', skipped.label, 'Skipped: Pull Up');
  check('endedEarly: status modified', resolveFinishStatus(deviations), 'modified');
}

// --- endedEarlyReason 'unfinished' folds to "Left unfinished, ..." (2026-09-04, closeUnfinishedSession) ---
{
  const slots: Record<string, ExerciseSlotLog> = {
    'strength:1': makeSlot('strength:1', { status: 'skipped' }),
    'calisthenics:1': makeSlot('calisthenics:1', { status: 'skipped' }),
    'cardio:1': makeSlot('cardio:1', { status: 'upcoming' }), // optional, excluded entirely
  };
  const performance = makePerformance({ slots, modifications: { endedEarly: true, endedEarlyReason: 'unfinished' } });
  const deviations = detectSessionDeviations(performance, TEMPLATE_SLOTS);
  const endedEarly = deviations.find((d) => d.kind === 'ended-early')!;
  check('unfinished: label reads "Left unfinished" not "Ended early"', endedEarly.label, 'Left unfinished, 2 exercises not done');
  check('unfinished: status modified', resolveFinishStatus(deviations), 'modified');
}

// --- Optional-section slot with fewer sets than prescribed: not a deviation ---
{
  // Same rule as optional-section skips: doing less of something the program
  // itself marks optional is not a deviation from the prescription.
  const template: TrainingDayTemplate = {
    ...makeTemplate(),
    sections: [
      ...makeSections(),
      {
        id: 'accessory',
        name: 'Optional Accessory',
        order: 4,
        type: 'strength',
        optional: true,
        exercises: [
          { exerciseId: 'curl', order: 1, prescription: { type: 'repetitions', sets: 3, minReps: 8, maxReps: 12 } },
        ],
      },
    ],
  };
  const slots = flattenTemplateSlots(template);
  const performance = makePerformance({
    slots: {
      ...fullyCompletedSlots(),
      'accessory:1': {
        slotKey: 'accessory:1',
        prescribedExerciseId: 'curl',
        chosenExerciseId: 'curl',
        status: 'completed',
        sets: [completedSet(1)],
      },
    },
    exercisesSnapshot: { ...EXERCISES, curl: exercise('curl', 'Biceps Curl') },
    templateSnapshot: template,
  });
  const deviations = detectSessionDeviations(performance, slots);
  check('optional-section slot with 1 of 3 sets: zero deviations', deviations.length, 0);
}

// --- Deterministic ordering ---
{
  const slots = fullyCompletedSlots();
  slots['strength:1'] = makeSlot('strength:1', { status: 'skipped' });
  const performance = makePerformance({
    slots,
    modifications: {
      reducedLoadSlotKeys: ['calisthenics:1'],
      substitutions: [{ slotKey: 'calisthenics:1', fromExerciseId: 'pull-up', toExerciseId: 'goblet-squat' }],
      recoveryMode: true,
    },
  });
  const first = detectSessionDeviations(performance, TEMPLATE_SLOTS);
  const second = detectSessionDeviations(performance, TEMPLATE_SLOTS);
  check('deterministic ordering: identical output on repeat calls', second, first);
  check(
    'deterministic ordering: kind order matches spec (skip, reduced-load, substituted, recovery)',
    kinds(first),
    ['skipped-exercise', 'reduced-load', 'substituted-exercise', 'recovery-mode']
  );
}

console.log('');
console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
