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

import { closeUnfinishedSession } from '../lib/workout-session/close-unfinished-session';
import { flattenTemplateSlots } from '../lib/workout-session/flatten-template-slots';
import {
  isResumableSession,
  isSampleSession,
  isStaleUnfinishedSession,
  RESUME_ACROSS_MIDNIGHT_HOURS,
  sessionHasLoggedWork,
} from '../lib/workout-session/resumable-session';
import type {
  ExerciseSlotLog,
  WorkoutSessionRecord,
} from '../lib/workout-session/workout-session-types';

const TODAY = '2026-08-26';
const YESTERDAY = '2026-08-25';
const NOW_MS = Date.parse(`${TODAY}T18:00:00.000Z`);
const HOUR_MS = 3600_000;

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
  startedAt?: string;
}): WorkoutSessionRecord {
  return {
    id: 'test-id',
    sessionDate: overrides.sessionDate ?? TODAY,
    weekday: 'wednesday',
    workoutTemplateId: overrides.workoutTemplateId ?? 'wednesday',
    startedAt: overrides.startedAt ?? `${overrides.sessionDate ?? TODAY}T10:00:00.000Z`,
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

function check(name: string, actual: unknown, expected: unknown): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passed += 1;
  } else {
    failed += 1;
    console.log(`FAIL: ${name} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
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
check('untouched session from today is resumable', isResumableSession(makeSession({}), TODAY, NOW_MS), true);
check('untouched session from yesterday is stale', isResumableSession(makeSession({ sessionDate: YESTERDAY }), TODAY, NOW_MS), false);
check(
  // 2026-09-04 fix: "survives midnight rollover" is now bounded by
  // RESUME_ACROSS_MIDNIGHT_HOURS, not unconditional — started at 11pm the
  // night before, checked at 1am (2h later, well within the window).
  'yesterday session WITH logged work survives midnight rollover, within the window',
  isResumableSession(
    makeSession({
      sessionDate: YESTERDAY,
      startedAt: `${YESTERDAY}T23:00:00.000Z`,
      slots: { 'slot-1': makeSlot({ status: 'completed' }) },
    }),
    TODAY,
    Date.parse(`${TODAY}T01:00:00.000Z`)
  ),
  true
);
check('completed session is never resumable', isResumableSession(makeSession({ status: 'completed' }), TODAY, NOW_MS), false);
check('missed session is never resumable', isResumableSession(makeSession({ status: 'missed' }), TODAY, NOW_MS), false);
// Phase 5 semantics change (2026-08-26): 'modified' is now a TERMINAL status
// assigned only at Finish, the same moment 'completed' is — a session is
// never "modified" mid-workout, so it must never be resumed, exactly like
// 'completed'.
check('modified session from today is NOT resumable (terminal status, Phase 5)', isResumableSession(makeSession({ status: 'modified' }), TODAY, NOW_MS), false);
check(
  'untouched sample session from today is resumable AS a sample (Today-button exclusion is isSampleSession, tested above)',
  isResumableSession(makeSession({ workoutTemplateId: 'sample-monday' }), TODAY, NOW_MS),
  true
);

// --- 2026-09-04 fix: a stale unfinished session (previous day, logged
// work, but started too long ago) must never hijack the next day. ---
const startedThreeHoursAgo = new Date(NOW_MS - 3 * HOUR_MS).toISOString();
const startedTenHoursAgo = new Date(NOW_MS - 10 * HOUR_MS).toISOString();
const yesterdayWithWork = (startedAt: string) =>
  makeSession({ sessionDate: YESTERDAY, startedAt, slots: { 'slot-1': makeSlot({ status: 'completed' }) } });

check(
  `yesterday session with logged work started 3h ago is resumable (within ${RESUME_ACROSS_MIDNIGHT_HOURS}h window)`,
  isResumableSession(yesterdayWithWork(startedThreeHoursAgo), TODAY, NOW_MS),
  true
);
check(
  'yesterday session with logged work started 3h ago is NOT stale',
  isStaleUnfinishedSession(yesterdayWithWork(startedThreeHoursAgo), TODAY, NOW_MS),
  false
);
check(
  `yesterday session with logged work started 10h ago is NOT resumable (beyond the ${RESUME_ACROSS_MIDNIGHT_HOURS}h window)`,
  isResumableSession(yesterdayWithWork(startedTenHoursAgo), TODAY, NOW_MS),
  false
);
check(
  'yesterday session with logged work started 10h ago IS stale',
  isStaleUnfinishedSession(yesterdayWithWork(startedTenHoursAgo), TODAY, NOW_MS),
  true
);
check(
  'an untouched previous-day session is neither resumable nor stale (resumable)',
  isResumableSession(makeSession({ sessionDate: YESTERDAY }), TODAY, NOW_MS),
  false
);
check(
  'an untouched previous-day session is neither resumable nor stale (stale)',
  isStaleUnfinishedSession(makeSession({ sessionDate: YESTERDAY }), TODAY, NOW_MS),
  false
);
check("today's session is always resumable, regardless of nowMs", isResumableSession(makeSession({}), TODAY, NOW_MS + 100 * HOUR_MS), true);
check('a completed session is never stale (terminal, not active)', isStaleUnfinishedSession(makeSession({ status: 'completed' }), TODAY, NOW_MS), false);

// --- closeUnfinishedSession ---
{
  const loggedSet: ExerciseSlotLog = {
    slotKey: 'slot-1',
    prescribedExerciseId: 'hack-squat',
    chosenExerciseId: 'hack-squat',
    status: 'completed',
    sets: [{ setNumber: 1, completed: true, weight: 100, reps: 8, rir: 2 }],
    draft: { weight: '105', reps: '' },
  };
  const untouchedSlot: ExerciseSlotLog = makeSlot({ slotKey: 'slot-2', status: 'upcoming' });
  const record = makeSession({
    sessionDate: YESTERDAY,
    startedAt: startedTenHoursAgo,
    slots: { 'slot-1': loggedSet, 'slot-2': untouchedSlot },
  });
  const templateSlots = flattenTemplateSlots(record.performance.templateSnapshot);
  const closed = closeUnfinishedSession(record, templateSlots);

  check('closeUnfinishedSession: status is modified', closed.status, 'modified');
  check('closeUnfinishedSession: upcoming slot becomes skipped', closed.performance.slots['slot-2'].status, 'skipped');
  check('closeUnfinishedSession: currentSlotKey is null', closed.performance.currentSlotKey, null);
  check('closeUnfinishedSession: endedEarlyReason is unfinished', closed.performance.modifications?.endedEarlyReason, 'unfinished');
  check('closeUnfinishedSession: endedEarly is true', closed.performance.modifications?.endedEarly, true);
  check('closeUnfinishedSession: completedAt stays null', closed.completedAt, null);
  check('closeUnfinishedSession: durationSeconds stays null', closed.durationSeconds, null);
  check('closeUnfinishedSession: logged slot status untouched', closed.performance.slots['slot-1'].status, 'completed');
  check('closeUnfinishedSession: logged sets untouched', closed.performance.slots['slot-1'].sets, loggedSet.sets);
  check('closeUnfinishedSession: logged slot draft cleared', closed.performance.slots['slot-1'].draft, undefined);
  check('closeUnfinishedSession: untouched slot draft cleared', closed.performance.slots['slot-2'].draft, undefined);
}

console.log('');
console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
