import type { Weekday } from "@/lib/program/program-types";

const WEEKDAYS_BY_JS_DAY_INDEX: Weekday[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

/**
 * Device-local weekday for a Date, using its local calendar fields (never
 * UTC) — mirrors local-date-string.ts's reasoning: the server renders in
 * UTC, so "today" must be resolved from the athlete's own clock, not the
 * server's.
 */
export function getLocalWeekday(date: Date): Weekday {
  return WEEKDAYS_BY_JS_DAY_INDEX[date.getDay()];
}
