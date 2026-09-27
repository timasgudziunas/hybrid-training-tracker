/**
 * Tests for lib/workout-session/make-up-candidates.ts (the make-up window
 * rule) plus the effective-date grouping in lib/history/session-filtering.ts
 * and the `madeUpOn` field of lib/history/day-classification.ts that the
 * rule depends on.
 *
 * Run with:
 *   npx tsx scripts/test-make-up-candidates.ts
 *
 * Exits non-zero on any failure.
 */

import {
  findMakeUpCandidates,
  makeUpCandidateForDate,
  MAKE_UP_WINDOW_DAYS,
  type MakeUpProgramWeek,
} from '../lib/workout-session/make-up-candidates';
import { effectiveSessionDate, groupSessionsByDate, type SessionLike } from '../lib/history/session-filtering';
import { classifyDay, type DaySessionRef } from '../lib/history/day-classification';
import type { RestDayTemplate, TrainingDayTemplate, Weekday, WorkoutTemplate } from '../lib/program/program-types';

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

function trainingDay(weekday: Exclude<Weekday, 'sunday'>, name: string): TrainingDayTemplate {
  return { restDay: false, id: weekday, weekday, name, ultimatePracticeLater: false, sections: [] };
}

function restDay(weekday: Weekday): RestDayTemplate {
  return { restDay: true, id: weekday, weekday, name: 'Rest', description: 'Rest.' };
}

// Five-day program: Mon to Fri train, Sat and Sun rest (Block 3's shape).
const templates: Record<Weekday, WorkoutTemplate> = {
  monday: trainingDay('monday', 'Lower A'),
  tuesday: trainingDay('tuesday', 'Upper A'),
  wednesday: trainingDay('wednesday', 'Speed'),
  thursday: trainingDay('thursday', 'Lower B'),
  friday: trainingDay('friday', 'Upper B'),
  saturday: restDay('saturday'),
  sunday: restDay('sunday'),
};

const program: MakeUpProgramWeek = { templates, activeSinceDate: '2026-09-01' };

function ref(status: DaySessionRef['status'], extra: Partial<DaySessionRef> = {}): DaySessionRef {
  return { id: `s-${status}`, status, ...extra };
}

// 2026-09-27 is a Sunday; 2026-09-25 a Friday; 2026-09-24 a Thursday.

check('window constant is the owner decision', MAKE_UP_WINDOW_DAYS, 3);

check(
  'Sunday with nothing logged offers Fri and Thu (Sat is rest), most recent first',
  findMakeUpCandidates({ today: '2026-09-27', program, sessionByDate: new Map() }).map((c) => [c.date, c.weekday, c.template.name]),
  [
    ['2026-09-25', 'friday', 'Upper B'],
    ['2026-09-24', 'thursday', 'Lower B'],
  ]
);

check(
  'window is exactly 3 days: Monday offers Fri (3 back) and Thu is out',
  findMakeUpCandidates({ today: '2026-09-28', program, sessionByDate: new Map() }).map((c) => c.date),
  ['2026-09-25']
);

check(
  'a completed day is not a candidate',
  findMakeUpCandidates({
    today: '2026-09-27',
    program,
    sessionByDate: new Map([['2026-09-25', ref('completed')]]),
  }).map((c) => c.date),
  ['2026-09-24']
);

check(
  'a modified day is not a candidate',
  findMakeUpCandidates({
    today: '2026-09-27',
    program,
    sessionByDate: new Map([['2026-09-25', ref('modified')]]),
  }).map((c) => c.date),
  ['2026-09-24']
);

check(
  'an unfinished (active) row leaves the day open',
  findMakeUpCandidates({
    today: '2026-09-26',
    program,
    sessionByDate: new Map([['2026-09-25', ref('active')]]),
  }).map((c) => c.date),
  ['2026-09-25', '2026-09-24', '2026-09-23']
);

check(
  'a day already made up (keyed by effective date) is excluded',
  findMakeUpCandidates({
    today: '2026-09-27',
    program,
    sessionByDate: new Map([['2026-09-25', ref('completed', { sessionDate: '2026-09-26', makeUpForDate: '2026-09-25' })]]),
  }).map((c) => c.date),
  ['2026-09-24']
);

check(
  'days before the program was active are never candidates',
  findMakeUpCandidates({ today: '2026-09-27', program: { templates, activeSinceDate: '2026-09-25' }, sessionByDate: new Map() }).map(
    (c) => c.date
  ),
  ['2026-09-25']
);

check('no program means no candidates', findMakeUpCandidates({ today: '2026-09-27', program: null, sessionByDate: new Map() }), []);

check(
  'a custom window widens the search',
  findMakeUpCandidates({ today: '2026-09-27', program, sessionByDate: new Map(), windowDays: 5 }).map((c) => c.date),
  ['2026-09-25', '2026-09-24', '2026-09-23', '2026-09-22']
);

// Single-date validation (the ?makeUpFor= route guard).
check(
  'makeUpCandidateForDate accepts a missed Friday on Sunday',
  makeUpCandidateForDate({ date: '2026-09-25', today: '2026-09-27', program, sessionByDate: new Map() })?.template.name,
  'Upper B'
);
check(
  'makeUpCandidateForDate rejects today',
  makeUpCandidateForDate({ date: '2026-09-27', today: '2026-09-27', program, sessionByDate: new Map() }),
  null
);
check(
  'makeUpCandidateForDate rejects a future date',
  makeUpCandidateForDate({ date: '2026-09-28', today: '2026-09-27', program, sessionByDate: new Map() }),
  null
);
check(
  'makeUpCandidateForDate rejects a date outside the window',
  makeUpCandidateForDate({ date: '2026-09-23', today: '2026-09-27', program, sessionByDate: new Map() }),
  null
);
check(
  'makeUpCandidateForDate rejects a rest day (Saturday)',
  makeUpCandidateForDate({ date: '2026-09-26', today: '2026-09-27', program, sessionByDate: new Map() }),
  null
);
check(
  'makeUpCandidateForDate rejects a day that was trained',
  makeUpCandidateForDate({
    date: '2026-09-25',
    today: '2026-09-27',
    program,
    sessionByDate: new Map([['2026-09-25', ref('completed')]]),
  }),
  null
);

// Effective-date grouping.
function session(id: string, sessionDate: string, extra: Partial<SessionLike> = {}): SessionLike {
  return { id, sessionDate, workoutTemplateId: 'friday', status: 'completed', startedAt: `${sessionDate}T10:00:00Z`, ...extra };
}

check('effectiveSessionDate is the performed date for an ordinary session', effectiveSessionDate(session('a', '2026-09-26')), '2026-09-26');
check(
  'effectiveSessionDate is the missed date for a make-up',
  effectiveSessionDate(session('a', '2026-09-26', { makeUpForDate: '2026-09-25' })),
  '2026-09-25'
);
check(
  'effectiveSessionDate treats null makeUpForDate as ordinary',
  effectiveSessionDate(session('a', '2026-09-26', { makeUpForDate: null })),
  '2026-09-26'
);

{
  const grouped = groupSessionsByDate([session('mk', '2026-09-26', { makeUpForDate: '2026-09-25' }), session('sat', '2026-09-26', { status: 'active' })]);
  check('groupSessionsByDate keys a make-up under the missed date', grouped.get('2026-09-25')?.id, 'mk');
  check('groupSessionsByDate leaves the performed date to its own rows', grouped.get('2026-09-26')?.id, 'sat');
}

{
  const grouped = groupSessionsByDate([
    session('mk', '2026-09-26', { makeUpForDate: '2026-09-25' }),
    session('fri', '2026-09-25', { status: 'active' }),
  ]);
  check('a completed make-up outranks an unfinished row on the missed date itself', grouped.get('2026-09-25')?.id, 'mk');
}

// Classification of a made-up day.
{
  const classification = classifyDay({
    date: '2026-09-25',
    today: '2026-09-27',
    weekday: 'friday',
    program,
    session: ref('completed', { sessionDate: '2026-09-26', makeUpForDate: '2026-09-25' }),
  });
  check('a made-up day classifies as completed', classification.state, 'completed');
  check('a made-up day reports the performed date', classification.madeUpOn, '2026-09-26');
}
{
  const classification = classifyDay({
    date: '2026-09-25',
    today: '2026-09-27',
    weekday: 'friday',
    program,
    session: ref('completed', { sessionDate: '2026-09-25' }),
  });
  check('an on-time day has no madeUpOn', classification.madeUpOn, null);
}
{
  const classification = classifyDay({
    date: '2026-09-26',
    today: '2026-09-27',
    weekday: 'saturday',
    program,
    session: null,
  });
  check('the performed date of a make-up stays a plain rest day', classification.state, 'rest');
}

console.log(`${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
