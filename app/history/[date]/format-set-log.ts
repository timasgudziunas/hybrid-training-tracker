import type { Prescription } from "@/lib/program/program-types";
import type { SetLog } from "@/lib/workout-session/workout-session-types";

/**
 * Full-detail line for one logged set in the day drill-down. Unlike the
 * compact "last time" summary shown mid-workout
 * (app/workout/active/previous-performance-summary.tsx), this is the
 * historical record itself, so it includes RIR and sprint times too.
 */
export function formatSetLog(set: SetLog, prescriptionType: Prescription["type"]): string {
  if (prescriptionType === "repetitions") {
    const parts: string[] = [];
    if (set.weight !== undefined && set.reps !== undefined) {
      parts.push(`${set.weight} x ${set.reps}`);
    } else if (set.reps !== undefined) {
      parts.push(`${set.reps} reps`);
    }
    if (set.rir !== undefined) {
      parts.push(`RIR ${set.rir}`);
    }
    return parts.length > 0 ? parts.join(", ") : "Logged";
  }

  if (prescriptionType === "hold" || prescriptionType === "duration") {
    return set.seconds !== undefined ? `${set.seconds} sec` : "Logged";
  }

  if (prescriptionType === "distance") {
    return set.timeSeconds !== undefined ? `${set.timeSeconds} sec` : "Completed";
  }

  return "Logged";
}
