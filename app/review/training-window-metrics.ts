/**
 * Pure, small metrics over a date window for the Review dashboard: section-
 * type exposures (speed/power) and Ultimate-practice attendance counts. Both
 * read only what was actually logged or explicitly recorded — no inference.
 */

import type { SectionType } from "@/lib/program/program-types";
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
 * Counts calendar days in `dates` where the athlete explicitly checked
 * Ultimate practice as attended in-app (2026-08-26,
 * app/today/ultimate-practice-actions.ts). Never assumes attendance from the
 * program's `ultimatePracticeLater` schedule flag: practice can be missed,
 * cancelled, or rescheduled, so only a checked day counts.
 */
export function countUltimatePracticeDays({
  dates,
  attendedDates,
}: {
  dates: string[];
  attendedDates: ReadonlySet<string>;
}): number {
  let count = 0;
  for (const date of dates) {
    if (attendedDates.has(date)) count += 1;
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
