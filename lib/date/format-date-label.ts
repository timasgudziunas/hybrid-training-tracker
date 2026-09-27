/**
 * Human-readable labels for "yyyy-mm-dd" date strings, built from the
 * string's own numeric fields only. `new Date(year, month, day)` reads its
 * arguments as literal local calendar fields and the same Date is read
 * back immediately, so the result never shifts with the runtime's timezone
 * (a `new Date("yyyy-mm-dd")` parse would read UTC midnight and can land on
 * the previous day). Used by History's day pages and by the make-up labels
 * on Today, the active workout, and the completion screen.
 */

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
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
const MONTH_ABBREVIATIONS = MONTH_NAMES.map((name) => name.slice(0, 3));

function weekdayNameOf(year: number, month: number, day: number): string {
  return WEEKDAY_NAMES[new Date(year, month - 1, day).getDay()];
}

/** "Monday, August 25, 2026". */
export function formatDateLabel(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return `${weekdayNameOf(year, month, day)}, ${MONTH_NAMES[month - 1]} ${day}, ${year}`;
}

/** "Monday, Aug 25": for labels that show a date beside other text or two
 * dates side by side (make-up lines), where the year is noise. */
export function formatDateLabelShort(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return `${weekdayNameOf(year, month, day)}, ${MONTH_ABBREVIATIONS[month - 1]} ${day}`;
}
