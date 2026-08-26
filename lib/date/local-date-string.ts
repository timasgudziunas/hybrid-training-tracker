// Formats a Date using its LOCAL calendar fields (never UTC). Used to compute
// "today" from the device's own clock, since server time (UTC on Vercel) can
// disagree with the athlete's local calendar date.
export function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
