/**
 * Pure, small metrics over a date window for the Review dashboard: section-
 * type exposures (speed/power) and Ultimate-practice day counts. Both read
 * only what was actually logged or actively programmed — no inference.
 */

import type { SectionType, Weekday } from "@/lib/program/program-types";
import type { ActiveProgramWeek } from "@/lib/history/day-classification";
import type { WorkoutSessionRecord, WorkoutSessionStatus } from "@/lib/workout-session/workout-session-types";
import { addDays, compareDateStrings } from "@/lib/history/calendar-grid";

const COUNTABLE_STATUSES: ReadonlySet<WorkoutSessionStatus> = new Set(["completed", "modified"]);

/** Count of completed/modified sessions whose own templateSnapshot includes
 * a section of `sectionType` — an exposure count (PRODUCT_SPEC §16: "1
 * speed session, 1 power session"), not a planned/prescribed count. */
export function countSectionTypeExposures(sessions: WorkoutSessionRecord[], sectionType: SectionType): number {
  return sessions.filter(
    (session) =>
      COUNTABLE_STATUSES.has(session.status) &&
      session.performance.templateSnapshot.sections.some((section) => section.type === sectionType)
  ).length;
}

/**
 * Counts calendar days in `dates` where Ultimate practice happened later
 * that day. For a day with a real logged session, reads that session's own
 * templateSnapshot flag (what was true the day it was started — immune to a
 * later re-paste); for a day with no session, falls back to the active
 * program's current template for that weekday, a plain approximation since
 * no snapshot exists for a day nothing was logged.
 */
export function countUltimatePracticeDays({
  dates,
  sessionByDate,
  program,
  getWeekday,
}: {
  dates: string[];
  sessionByDate: Map<string, WorkoutSessionRecord>;
  program: ActiveProgramWeek | null;
  getWeekday: (date: string) => Weekday;
}): number {
  let count = 0;
  for (const date of dates) {
    const session = sessionByDate.get(date);
    if (session) {
      if (session.performance.templateSnapshot.ultimatePracticeLater) count += 1;
      continue;
    }
    if (!program || compareDateStrings(date, program.activeSinceDate) < 0) continue;
    const template = program.templates[getWeekday(date)];
    if (!template.restDay && template.ultimatePracticeLater) count += 1;
  }
  return count;
}

/** Inclusive "yyyy-mm-dd" dates from startDate to endDate. */
export function dateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  for (let date = startDate; compareDateStrings(date, endDate) <= 0; date = addDays(date, 1)) {
    dates.push(date);
  }
  return dates;
}
