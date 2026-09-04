/**
 * Tests for lib/workout-session/cardio-slot.ts,
 * lib/workout-session/format-logged-set.ts, and the totalCardioSeconds
 * addition to lib/workout-session/completion-stats.ts (owner request,
 * 2026-09-04: dedicated cardio entry flow with resistance/watts/speed
 * tracked separately from ordinary hold/duration work). Pre-registered
 * assertions, in the style of scripts/test-session-deviations.ts.
 *
 * Run with:
 *   npx tsx scripts/test-cardio-slot.ts
 *
 * Exits non-zero on any failure.
 */

import {
  cardioTargetLabel,
  cardioVerbFor,
  isCardioSlot,
} from '../lib/workout-session/cardio-slot';
import { formatLoggedSet } from '../lib/workout-session/format-logged-set';
import { computeCompletionStats } from '../lib/workout-session/completion-stats';
import type { TemplateSlot } from '../lib/workout-session/flatten-template-slots';
import type {
  DurationPrescription,
  Exercise,
  QualitativePrescription,
  RepetitionsPrescription,
  WorkoutSection,
} from '../lib/program/program-types';
import type {
  ExerciseSlotLog,
  SetLog,
  WorkoutSessionPerformance,
} from '../lib/workout-session/workout-session-types';

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

function section(overrides: Partial<WorkoutSection>): WorkoutSection {
  return {
    id: 's1',
    name: 'Section',
    order: 1,
    type: 'strength',
    exercises: [],
    ...overrides,
  };
}

function exercise(overrides: Partial<Exercise>): Exercise {
  return {
    id: 'ex1',
    name: 'Exercise',
    category: 'hypertrophy',
    primaryMuscles: [],
    secondaryMuscles: [],
    progressionType: 'none',
    ...overrides,
  };
}

const QUALITATIVE: QualitativePrescription = { type: 'qualitative', description: 'Easy pace.' };
const DURATION: DurationPrescription = { type: 'duration', sets: 1, minSeconds: 480, maxSeconds: 600 };
const REPETITIONS: RepetitionsPrescription = { type: 'repetitions', sets: 3, minReps: 8, maxReps: 12 };

// --- isCardioSlot ---
check(
  'isCardioSlot: section type cardio + qualitative -> true',
  isCardioSlot(section({ type: 'cardio' }), exercise({ name: 'Zone 2' }), QUALITATIVE),
  true
);
check(
  'isCardioSlot: category cardio + duration -> true',
  isCardioSlot(section({ type: 'warmup' }), exercise({ name: 'Machine Work', category: 'cardio' }), DURATION),
  true
);
check(
  'isCardioSlot: name "Easy Cycling" in warmup section + qualitative -> true',
  isCardioSlot(section({ type: 'warmup' }), exercise({ name: 'Easy Cycling' }), QUALITATIVE),
  true
);
check(
  'isCardioSlot: "Chest-Supported Row" repetitions -> false (prescription guard)',
  isCardioSlot(section({ type: 'strength' }), exercise({ name: 'Chest-Supported Row' }), REPETITIONS),
  false
);
check(
  'isCardioSlot: "Wrist Preparation" duration in calisthenics section -> false',
  isCardioSlot(section({ type: 'calisthenics' }), exercise({ name: 'Wrist Preparation' }), DURATION),
  false
);

// --- cardioVerbFor ---
check('cardioVerbFor: cycling', cardioVerbFor('Easy Cycling'), 'cycling');
check('cardioVerbFor: rowing', cardioVerbFor('Rowing Machine'), 'rowing');
check('cardioVerbFor: running', cardioVerbFor('Treadmill Run'), 'running');
check('cardioVerbFor: walking', cardioVerbFor('Incline Walk'), 'walking');
check('cardioVerbFor: unknown falls back to cardio', cardioVerbFor('Mystery Machine'), 'cardio');

// --- cardioTargetLabel ---
check(
  'cardioTargetLabel: approx range',
  cardioTargetLabel({ type: 'qualitative', description: 'Cycle easy.', approxMinMinutes: 8, approxMaxMinutes: 10 }),
  '8 to 10 min'
);
check(
  'cardioTargetLabel: single value',
  cardioTargetLabel({ type: 'qualitative', description: 'Cycle easy.', approxMinMinutes: 10, approxMaxMinutes: 10 }),
  '10 min'
);
check(
  'cardioTargetLabel: duration seconds >= 60 and exact minutes',
  cardioTargetLabel({ type: 'duration', sets: 1, minSeconds: 600, maxSeconds: 900 }),
  '10 to 15 min'
);
check(
  'cardioTargetLabel: duration seconds that do not land on exact minutes stays in seconds',
  cardioTargetLabel({ type: 'duration', sets: 1, minSeconds: 60, maxSeconds: 90 }),
  '60 to 90 sec'
);
check(
  'cardioTargetLabel: none prescribed -> null',
  cardioTargetLabel({ type: 'qualitative', description: 'Cycle easy.' }),
  null
);

// --- formatLoggedSet ---
check(
  'formatLoggedSet: cardio set with all fields',
  formatLoggedSet(
    { setNumber: 1, completed: true, seconds: 750, resistance: '8', averageWatts: 150, averageSpeedMph: 18.2 },
    'duration'
  ),
  '12:30 at 8, 150 W avg, 18.2 mph avg'
);
check(
  'formatLoggedSet: cardio set with only seconds + resistance',
  formatLoggedSet({ setNumber: 1, completed: true, seconds: 90, resistance: 'L8' }, 'qualitative'),
  '1:30 at L8'
);
check(
  'formatLoggedSet: box height set',
  formatLoggedSet({ setNumber: 1, completed: true, boxHeightInches: 24, reps: 3 }, 'repetitions'),
  '24 in x 3'
);
check(
  'formatLoggedSet: jump distance set',
  formatLoggedSet({ setNumber: 1, completed: true, jumpDistanceInches: 96, reps: 3 }, 'repetitions'),
  '96 in x 3'
);
check(
  'formatLoggedSet: reps only set',
  formatLoggedSet({ setNumber: 1, completed: true, reps: 10 }, 'repetitions'),
  '10 reps'
);
check(
  'formatLoggedSet: weight set with RIR',
  formatLoggedSet({ setNumber: 1, completed: true, weight: 70, reps: 10, rir: 2 }, 'repetitions'),
  '70 x 10, RIR 2'
);

// --- computeCompletionStats: totalCardioSeconds vs totalHoldSeconds ---
{
  const cardioSection = section({ id: 'cardio', type: 'cardio', exercises: [] });
  const holdSection = section({ id: 'hold', type: 'calisthenics', exercises: [] });

  const templateSlots: TemplateSlot[] = [
    {
      slotKey: 'cardio:1',
      section: cardioSection,
      exercise: {
        exerciseId: 'bike',
        order: 1,
        prescription: { type: 'duration', sets: 1, minSeconds: 600, maxSeconds: 900 },
      },
    },
    {
      slotKey: 'hold:1',
      section: holdSection,
      exercise: {
        exerciseId: 'plank',
        order: 1,
        prescription: { type: 'hold', sets: 1, minSeconds: 30, maxSeconds: 60 },
      },
    },
  ];

  const cardioSet: SetLog = { setNumber: 1, completed: true, seconds: 700, resistance: '8', averageWatts: 150 };
  const holdSet: SetLog = { setNumber: 1, completed: true, seconds: 45 };

  const slots: Record<string, ExerciseSlotLog> = {
    'cardio:1': { slotKey: 'cardio:1', prescribedExerciseId: 'bike', status: 'completed', sets: [cardioSet] },
    'hold:1': { slotKey: 'hold:1', prescribedExerciseId: 'plank', status: 'completed', sets: [holdSet] },
  };

  const performance: WorkoutSessionPerformance = {
    slots,
    currentSlotKey: null,
    templateSnapshot: {
      restDay: false,
      id: 'sample-day',
      weekday: 'monday',
      name: 'Sample',
      ultimatePracticeLater: false,
      sections: [cardioSection, holdSection],
    },
    exercisesSnapshot: {},
  };

  const stats = computeCompletionStats(performance, templateSlots);
  check('computeCompletionStats: cardio duration set counts in totalCardioSeconds only', stats.totalCardioSeconds, 700);
  check('computeCompletionStats: plain hold set counts in totalHoldSeconds only', stats.totalHoldSeconds, 45);
}

console.log('');
console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
