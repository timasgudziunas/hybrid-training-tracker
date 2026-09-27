/**
 * Approximates "the calendar date the active program became active" from
 * its `createdAt` timestamp. A true device-local date isn't knowable for a
 * past server timestamp (only "today" can be resolved on the athlete's own
 * clock), so this is a deliberate, documented day-granularity approximation
 * using the timestamp's UTC date. Days before it are "unscheduled" in
 * History and never make-up candidates on Today.
 */
export function activeSinceDateFromCreatedAt(createdAt: string): string {
  return new Date(createdAt).toISOString().slice(0, 10);
}
