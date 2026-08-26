/**
 * Tests for lib/workout-session/resumable-session.ts — the rules that decide
 * whether a stored session resumes or is discarded (the "phantom Resume
 * workout" fix, 2026-08-26: opening /workout/active creates a session
 * immediately, so backing out used to leave the Today screen saying Resume
 * forever).
 *
 * Run with:
 *   npx tsx scripts/test-resumable-session.ts
 *
 * Exits non-zero on any failure.
 */

import {
  isResumableSession,
  isSampleSession,
  sessionHasLoggedWork,
} from '../lib/workout-session/resumable-session';
import type {
  ExerciseSlotLog,
  WorkoutSessionRecord,
} from '../lib/workout-session/workout-session-types';

const TODAY = '2026-08-26';
const YESTERDAY = '2026-08-25';

function makeSlot(overrides: Partial<ExerciseSlotLog> = {}): ExerciseSlotLog {
  return {
    slotKey: 'slot-1',
    prescribedExerciseId: 'hack-squat',
    chosenExerciseId: 'hack-squat',
    status: 'upcoming',
    sets: [],
    ...overrides,
  };
}

function makeSession(overrides: {
  sessionDate?: string;
  status?: WorkoutSessionRecord['status'];
  workoutTemplateId?: string;
  slots?: Record<string, ExerciseSlotLog>;
  sessionNote?: string;
  sessionDifficulty?: number;
}): WorkoutSessionRecord {
  return {
    id: 'test-id',
    sessionDate: overrides.sessionDate ?? TODAY,
    weekday: 'wednesday',
    workoutTemplateId: overrides.workoutTemplateId ?? 'wednesday',
    startedAt: `${overrides.sessionDate ?? TODAY}T10:00:00.000Z`,
    completedAt: null,
    status: overrides.status ?? 'active',
    durationSeconds: null,
    notes: null,
    sessionDifficulty: null,
    performance: {
      slots: overrides.slots ?? { 'slot-1': makeSlot() },
      currentSlotKey: 'slot-1',
      sessionNote: overrides.sessionNote,
      sessionDifficulty: overrides.sessionDifficulty,
      templateSnapshot: {
        id: overrides.workoutTemplateId ?? 'wednesday',
        weekday: 'wednesday',
        name: 'Test Day',
        restDay: false,
        ultimatePracticeLater: false,
        sections: [],
      },
      exercisesSnapshot: {},
    },
  };
}

let passed = 0;
let failed = 0;

function check(name: string, actual: boolean, expected: boolean): void {
  if (actual === expected) {
    passed += 1;
  } else {
    failed += 1;
    console.log(`FAIL: ${name} (expected ${expected}, got ${actual})`);
  }
}

// --- isSampleSession ---
check('sample-prefixed template id is a sample session', isSampleSession(makeSession({ workoutTemplateId: 'sample-monday' })), true);
check('bare weekday template id is not a sample session', isSampleSession(makeSession({})), false);

// --- sessionHasLoggedWork ---
check('brand-new session has no logged work', sessionHasLoggedWork(makeSession({})), false);
check('completed slot counts as work', sessionHasLoggedWork(makeSession({ slots: { 'slot-1': makeSlot({ status: 'completed' }) } })), true);
check('skipped slot counts as work', sessionHasLoggedWork(makeSession({ slots: { 'slot-1': makeSlot({ status: 'skipped' }) } })), true);
check('any set present counts as work', sessionHasLoggedWork(makeSession({ slots: { 'slot-1': makeSlot({ sets: [{ setNumber: 1, completed: false }] }) } })), true);
check('qualitative completion counts as work', sessionHasLoggedWork(makeSession({ slots: { 'slot-1': makeSlot({ qualitativeCompleted: true }) } })), true);
check('extra sets count as work', sessionHasLoggedWork(makeSession({ slots: { 'slot-1': makeSlot({ extraSets: 1 }) } })), true);
check('slot note counts as work', sessionHasLoggedWork(makeSession({ slots: { 'slot-1': makeSlot({ note: 'felt heavy' }) } })), true);
check('session note counts as work', sessionHasLoggedWork(makeSession({ sessionNote: 'good day' })), true);
check('session difficulty counts as work', sessionHasLoggedWork(makeSession({ sessionDifficulty: 3 })), true);

// --- isResumableSession ---
check('untouched session from today is resumable', isResumableSession(makeSession({}), TODAY), true);
check('untouched session from yesterday is stale', isResumableSession(makeSession({ sessionDate: YESTERDAY }), TODAY), false);
check(
  'yesterday session WITH logged work survives midnight rollover',
  isResumableSession(makeSession({ sessionDate: YESTERDAY, slots: { 'slot-1': makeSlot({ status: 'completed' }) } }), TODAY),
  true
);
check('completed session is never resumable', isResumableSession(makeSession({ status: 'completed' }), TODAY), false);
check('missed session is never resumable', isResumableSession(makeSession({ status: 'missed' }), TODAY), false);
// Phase 5 semantics change (2026-08-26): 'modified' is now a TERMINAL status
// assigned only at Finish, the same moment 'completed' is — a session is
// never "modified" mid-workout, so it must never be resumed, exactly like
// 'completed'.
check('modified session from today is NOT resumable (terminal status, Phase 5)', isResumableSession(makeSession({ status: 'modified' }), TODAY), false);
check(
  'untouched sample session from today is resumable AS a sample (Today-button exclusion is isSampleSession, tested above)',
  isResumableSession(makeSession({ workoutTemplateId: 'sample-monday' }), TODAY),
  true
);

console.log('');
console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
