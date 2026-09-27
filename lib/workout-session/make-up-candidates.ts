/**
 * Make-up sessions (owner decision 2026-09-27): a training day missed within
 * the last MAKE_UP_WINDOW_DAYS can be started on any later day, rest days
 * and Sunday included (this relaxes CLAUDE.md non-negotiables 11 and 20 by
 * owner decision: Sunday still renders as a rest day, but a missed session
 * may be made up on it). Pure: program week + dates + grouped sessions in,
 * candidates out. Today (app/today) renders the list; /workout/active
 * validates a requested make-up date with the same rule before creating the
 * session.
 */

import type { TrainingDayTemplate, Weekday, WorkoutTemplate } from '@/lib/program/program-types';
import { addDays, compareDateStrings, weekdayOfDateString } from '@/lib/history/calendar-grid';
import type { DaySessionRef } from '@/lib/history/day-classification';

/** How many days back a missed training day stays available to make up.
 * Owner decision 2026-09-27: 3. The program is a weekly cycle, so a session
 * later than this collides with its own next occurrence. */
export const MAKE_UP_WINDOW_DAYS = 3;

/** Statuses that mean the day's training is done; anything else (active,
 * planned, missed, nothing logged) leaves the day open to make up. */
const DONE_STATUSES = new Set<DaySessionRef['status']>(['completed', 'modified']);

export interface MakeUpCandidate {
  /** The missed training day, "yyyy-mm-dd". */
  date: string;
  weekday: Weekday;
  template: TrainingDayTemplate;
}

export interface MakeUpProgramWeek {
  templates: Record<Weekday, WorkoutTemplate>;
  /** Days before this were not covered by the active program and are never
   * candidates (see lib/history/active-since-date.ts). */
  activeSinceDate: string;
}

/**
 * Missed training days in [today - windowDays, today), most recent first.
 * `sessionByDate` must be keyed by EFFECTIVE date (groupSessionsByDate in
 * lib/history/session-filtering.ts), so a day already made up is excluded
 * the same way a day trained on time is.
 */
export function findMakeUpCandidates({
  today,
  program,
  sessionByDate,
  windowDays = MAKE_UP_WINDOW_DAYS,
}: {
  /** Device-local "yyyy-mm-dd". */
  today: string;
  program: MakeUpProgramWeek | null;
  sessionByDate: ReadonlyMap<string, DaySessionRef>;
  windowDays?: number;
}): MakeUpCandidate[] {
  if (!program) return [];
  const candidates: MakeUpCandidate[] = [];
  for (let back = 1; back <= windowDays; back += 1) {
    const date = addDays(today, -back);
    const candidate = makeUpCandidateForDate({ date, today, program, sessionByDate, windowDays });
    if (candidate) candidates.push(candidate);
  }
  return candidates;
}

/**
 * The single-date form of the rule above, for validating a `?makeUpFor=`
 * request on /workout/active: null when `date` is not a missed training
 * day inside the window.
 */
export function makeUpCandidateForDate({
  date,
  today,
  program,
  sessionByDate,
  windowDays = MAKE_UP_WINDOW_DAYS,
}: {
  date: string;
  today: string;
  program: MakeUpProgramWeek | null;
  sessionByDate: ReadonlyMap<string, DaySessionRef>;
  windowDays?: number;
}): MakeUpCandidate | null {
  if (!program) return null;
  if (compareDateStrings(date, today) >= 0) return null;
  if (compareDateStrings(date, addDays(today, -windowDays)) < 0) return null;
  if (compareDateStrings(date, program.activeSinceDate) < 0) return null;

  const weekday = weekdayOfDateString(date);
  const template = program.templates[weekday];
  if (!template || template.restDay) return null;

  const session = sessionByDate.get(date);
  if (session && DONE_STATUSES.has(session.status)) return null;

  return { date, weekday, template };
}
