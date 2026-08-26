/**
 * Tests for the Ultimate practice attendance rework (2026-08-26):
 * app/review/training-window-metrics.ts's countUltimatePracticeDays (now
 * counts explicit attendance, never the program's schedule flag) and
 * lib/history/day-classification.ts's classifyDay hasUltimatePractice
 * param. Pre-registered assertions, in the style of
 * scripts/test-session-deviations.ts. Pure functions only, no Supabase.
 *
 * Run with:
 *   npx tsx scripts/test-ultimate-practice-metrics.ts
 *
 * Exits non-zero on any failure.
 */

import { countUltimatePracticeDays } from '../app/review/training-window-metrics';
import { classifyDay, type ActiveProgramWeek } from '../lib/history/day-classification';
import type { TrainingDayTemplate, RestDayTemplate, WorkoutTemplate, Weekday } from '../lib/program/program-types';

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

function trainingDay(id: string, weekday: Exclude<Weekday, 'sunday'>, ultimatePracticeLater: boolean): TrainingDayTemplate {
  return {
    restDay: false,
    id,
    weekday,
    name: 'Test Day',
    ultimatePracticeLater,
    sections: [],
  };
}

function restDay(id: string, weekday: Weekday): RestDayTemplate {
  return { restDay: true, id, weekday, name: 'Rest', description: 'Rest day.' };
}

// A full week: Monday flagged for Ultimate practice, every other day
// unflagged, Sunday a true rest day.
function makeProgram(activeSinceDate: string): ActiveProgramWeek {
  const templates: Record<Weekday, WorkoutTemplate> = {
    monday: trainingDay('monday', 'monday', true),
    tuesday: trainingDay('tuesday', 'tuesday', false),
    wednesday: trainingDay('wednesday', 'wednesday', false),
    thursday: trainingDay('thursday', 'thursday', false),
    friday: trainingDay('friday', 'friday', false),
    saturday: trainingDay('saturday', 'saturday', false),
    sunday: restDay('sunday', 'sunday'),
  };
  return { templates, activeSinceDate };
}

const PROGRAM = makeProgram('2026-01-01');
const TODAY = '2026-08-26'; // Wednesday
const PAST_MONDAY = '2026-08-24';
const PAST_SUNDAY = '2026-08-23';

// --- countUltimatePracticeDays ---

check(
  'countUltimatePracticeDays: 0 for empty attendedDates',
  countUltimatePracticeDays({
    dates: ['2026-08-20', '2026-08-21', '2026-08-22', '2026-08-23', '2026-08-24', '2026-08-25', '2026-08-26'],
    attendedDates: new Set(),
  }),
  0
);

check(
  'countUltimatePracticeDays: 2 when 2 of 7 window dates are attended',
  countUltimatePracticeDays({
    dates: ['2026-08-20', '2026-08-21', '2026-08-22', '2026-08-23', '2026-08-24', '2026-08-25', '2026-08-26'],
    attendedDates: new Set(['2026-08-21', '2026-08-24']),
  }),
  2
);

check(
  'countUltimatePracticeDays: ignores attended dates outside the window\'s dates list',
  countUltimatePracticeDays({
    dates: ['2026-08-24', '2026-08-25', '2026-08-26'],
    attendedDates: new Set(['2026-08-21', '2026-08-24', '2026-09-01']),
  }),
  1
);

// --- classifyDay: hasUltimatePractice is explicit, never template-derived ---

check(
  'classifyDay: hasUltimatePractice false explicit, even with a flagged Monday template',
  classifyDay({
    date: PAST_MONDAY,
    today: TODAY,
    weekday: 'monday',
    program: PROGRAM,
    session: null,
    hasUltimatePractice: false,
  }).hasUltimatePractice,
  false
);

check(
  'classifyDay: hasUltimatePractice true explicit, even with an unflagged Tuesday template',
  classifyDay({
    date: '2026-08-25',
    today: TODAY,
    weekday: 'tuesday',
    program: PROGRAM,
    session: null,
    hasUltimatePractice: true,
  }).hasUltimatePractice,
  true
);

check(
  'classifyDay: hasUltimatePractice defaults to false when the param is omitted',
  classifyDay({
    date: PAST_MONDAY,
    today: TODAY,
    weekday: 'monday',
    program: PROGRAM,
    session: null,
  }).hasUltimatePractice,
  false
);

// --- classifyDay: state logic unchanged ---

check(
  'classifyDay: a flagged Monday in the past with no session still classifies missed',
  classifyDay({
    date: PAST_MONDAY,
    today: TODAY,
    weekday: 'monday',
    program: PROGRAM,
    session: null,
  }).state,
  'missed'
);

check(
  'classifyDay: a rest Sunday classifies rest',
  classifyDay({
    date: PAST_SUNDAY,
    today: TODAY,
    weekday: 'sunday',
    program: PROGRAM,
    session: null,
  }).state,
  'rest'
);

// --- A couple more edge assertions ---

check(
  'countUltimatePracticeDays: counts all dates when every one is attended',
  countUltimatePracticeDays({
    dates: ['2026-08-24', '2026-08-25'],
    attendedDates: new Set(['2026-08-24', '2026-08-25']),
  }),
  2
);

check(
  'classifyDay: today, a training day, not yet completed classifies scheduled',
  classifyDay({
    date: TODAY,
    today: TODAY,
    weekday: 'wednesday',
    program: PROGRAM,
    session: null,
  }).state,
  'scheduled'
);

console.log('');
console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
