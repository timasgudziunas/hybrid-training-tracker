import type { Prescription } from "@/lib/program/program-types";
import type { SetLog } from "@/lib/workout-session/workout-session-types";
import { formatLoggedSet } from "@/lib/workout-session/format-logged-set";

/**
 * Full-detail line for one logged set in the day drill-down. Delegates to
 * the shared formatter (lib/workout-session/format-logged-set.ts), which
 * also backs the "last time" panel shown mid-workout
 * (app/workout/active/previous-performance-summary.tsx) so the two never
 * drift apart again.
 */
export function formatSetLog(set: SetLog, prescriptionType: Prescription["type"]): string {
  return formatLoggedSet(set, prescriptionType);
}
