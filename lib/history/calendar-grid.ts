/**
 * Pure month-grid construction for the History calendar (R4). Weeks start
 * Monday per CLAUDE.md UX conventions elsewhere in the app. Every date here
 * is a device-local "yyyy-mm-dd" string, built from explicit (year,
 * monthIndex, day) fields the caller supplies — never from the server's own
 * clock — so this module stays a pure, unit-testable function of its inputs
 * (CLAUDE.md "shared logic is pure").
 */

import { getLocalDateString } from "@/lib/date/local-date-string";
import { getLocalWeekday } from "@/lib/date/weekday-from-date";
import type { Weekday } from "@/lib/program/program-types";

export interface CalendarDayCell {
  /** yyyy-mm-dd */
  date: string;
  day: number;
  weekday: Weekday;
  /** False for the leading/trailing days from adjacent months used to pad
   * each week to a full 7 days. */
  inCurrentMonth: boolean;
}

export interface MonthGrid {
  year: number;
  /** 0-11 */
  monthIndex: number;
  /** e.g. "August 2026" */
  label: string;
  weeks: CalendarDayCell[][];
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function cellFor(date: Date, inCurrentMonth: boolean): CalendarDayCell {
  return {
    date: getLocalDateString(date),
    day: date.getDate(),
    weekday: getLocalWeekday(date),
    inCurrentMonth,
  };
}

/**
 * Builds a Monday-start month grid for (year, monthIndex), padded with
 * leading/trailing days from adjacent months so every week is a full 7
 * days. `new Date(year, monthIndex, day)` reads its arguments as literal
 * calendar fields (no timezone conversion), which is exactly what a pure
 * date-math function needs — it is not "the current time" in any zone.
 */
export function buildMonthGrid(year: number, monthIndex: number): MonthGrid {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstOfMonth = new Date(year, monthIndex, 1);
  // getDay(): 0=Sunday..6=Saturday. Shift so Monday=0..Sunday=6.
  const leadingCount = (firstOfMonth.getDay() + 6) % 7;

  const cells: CalendarDayCell[] = [];

  for (let i = leadingCount; i > 0; i -= 1) {
    cells.push(cellFor(new Date(year, monthIndex, 1 - i), false));
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(cellFor(new Date(year, monthIndex, day), true));
  }

  let trailing = 1;
  while (cells.length % 7 !== 0) {
    cells.push(cellFor(new Date(year, monthIndex + 1, trailing), false));
    trailing += 1;
  }

  const weeks: CalendarDayCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return { year, monthIndex, label: `${MONTH_NAMES[monthIndex]} ${year}`, weeks };
}

/** Parses a "yyyy-mm-dd" string into the (year, monthIndex) it falls in. */
export function monthOfDateString(date: string): { year: number; monthIndex: number } {
  const [year, month] = date.split("-").map(Number);
  return { year, monthIndex: month - 1 };
}

/** Adds `delta` calendar months to (year, monthIndex), wrapping the year. */
export function addMonths(year: number, monthIndex: number, delta: number): { year: number; monthIndex: number } {
  const total = year * 12 + monthIndex + delta;
  return { year: Math.floor(total / 12), monthIndex: ((total % 12) + 12) % 12 };
}

/** Lexicographic compare works directly on "yyyy-mm-dd" strings since the
 * format is fixed-width and zero-padded. */
export function compareDateStrings(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/** One calendar day after `date` ("yyyy-mm-dd" in, "yyyy-mm-dd" out). */
export function addDays(date: string, days: number): string {
  const { year, monthIndex } = monthOfDateString(date);
  const day = Number(date.split("-")[2]);
  return getLocalDateString(new Date(year, monthIndex, day + days));
}

export function weekdayOfDateString(date: string): Weekday {
  const { year, monthIndex } = monthOfDateString(date);
  const day = Number(date.split("-")[2]);
  return getLocalWeekday(new Date(year, monthIndex, day));
}
