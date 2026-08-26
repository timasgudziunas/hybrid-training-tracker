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

/** Formats a "yyyy-mm-dd" date string as "Monday, August 25, 2026", using
 * only the date's own numeric fields (never the server's clock/timezone —
 * `new Date(year, month, day)` reads its arguments as literal calendar
 * fields, and this function both builds and reads that same Date, so the
 * result is stable regardless of the runtime's timezone). */
export function formatDateLabel(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = WEEKDAY_NAMES[new Date(year, month - 1, day).getDay()];
  return `${weekday}, ${MONTH_NAMES[month - 1]} ${day}, ${year}`;
}
