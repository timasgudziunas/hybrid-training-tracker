/**
 * Adherence percent (PRODUCT_SPEC §15: "22 / 24 planned sessions completed,
 * 92% adherence", preferred over streak-centric gamification).
 *
 * Definition (PLAN.md R4): (completed + modified sessions) / scheduled
 * training days, over a trailing window ending today (default 28 days /
 * "last 4 weeks"). Scheduled days come from the active program's weekly
 * template (its non-rest weekdays). Days with no active program, or before
 * the active program existed, are excluded from both sides of the ratio —
 * never counted as a miss. Sample-workout sessions never count (exclude
 * them from `sessionByDate` first — see session-filtering.ts). Future days
 * never count.
 *
 * Judgment call: today itself is included in the scheduled/denominator side
 * exactly like any other day (if it's a training day) even though the day
 * isn't over yet — it just won't count toward the numerator until a session
 * is logged. This keeps the number an honest "as of right now" reading
 * without a separate carve-out for the current day.
 */

import type { Weekday } from "@/lib/program/program-types";
import { addDays, compareDateStrings } from "./calendar-grid";
import { classifyDay, type ActiveProgramWeek, type DaySessionRef } from "./day-classification";

const DEFAULT_WINDOW_DAYS = 28;

export interface AdherenceResult {
  /** Plain label, e.g. "Last 4 weeks". */
  windowLabel: string;
  windowStartDate: string;
  windowEndDate: string;
  scheduledDays: number;
  metDays: number;
  /** Null when there were zero scheduled days in the window (no active
   * program covered any of it) — nothing to divide by, not a 0%. */
  percent: number | null;
}

export function computeAdherence({
  today,
  windowDays = DEFAULT_WINDOW_DAYS,
  program,
  sessionByDate,
  getWeekday,
}: {
  today: string;
  windowDays?: number;
  program: ActiveProgramWeek | null;
  /** Already excludes sample sessions and is one row per date (see
   * groupSessionsByDate). */
  sessionByDate: Map<string, DaySessionRef>;
  getWeekday: (date: string) => Weekday;
}): AdherenceResult {
  const windowStartDate = addDays(today, -(windowDays - 1));

  let scheduledDays = 0;
  let metDays = 0;

  for (let date = windowStartDate; compareDateStrings(date, today) <= 0; date = addDays(date, 1)) {
    const classification = classifyDay({
      date,
      today,
      weekday: getWeekday(date),
      program,
      session: sessionByDate.get(date) ?? null,
    });

    if (classification.state === "unscheduled" || classification.state === "rest" || classification.state === "future") {
      continue;
    }

    scheduledDays += 1;
    if (classification.state === "completed" || classification.state === "modified") {
      metDays += 1;
    }
  }

  const weeks = Math.round(windowDays / 7);

  return {
    windowLabel: `Last ${weeks} week${weeks === 1 ? "" : "s"}`,
    windowStartDate,
    windowEndDate: today,
    scheduledDays,
    metDays,
    percent: scheduledDays > 0 ? Math.round((metDays / scheduledDays) * 100) : null,
  };
}
