"use server";

/**
 * Server action for the Review dashboard (R8, old Phase 10). Reuses the same
 * `workout_sessions` degrade-gracefully posture as every other action file
 * in this app (app/history/actions.ts, app/workout/actions.ts): never crash
 * because the table isn't there yet or a query fails, return a typed
 * failure instead.
 *
 * The History feature's own fetchSessionSummaries (app/history/actions.ts)
 * deliberately omits the `performance` jsonb blob to keep the calendar's
 * client bundle small. Review needs the full record (templateSnapshot,
 * slots, exercisesSnapshot) to compute exercise progression and section-type
 * exposures, so it gets its own range query rather than modifying that
 * file's shape for one other caller.
 */

import { getAthleteContext } from "@/lib/auth/athlete-context";
import { isSampleSession } from "@/lib/history/session-filtering";
import type { WorkoutSessionRecord, WorkoutSessionStatus } from "@/lib/workout-session/workout-session-types";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; reason: string };

const SESSIONS_TABLE = "workout_sessions";

type WorkoutSessionDbRow = {
  id: string;
  session_date: string;
  weekday: string;
  workout_template_id: string;
  started_at: string;
  completed_at: string | null;
  status: WorkoutSessionStatus;
  duration_seconds: number | null;
  notes: string | null;
  session_difficulty: number | null;
  performance: WorkoutSessionRecord["performance"];
};

function recordFromDbRow(row: WorkoutSessionDbRow): WorkoutSessionRecord {
  return {
    id: row.id,
    sessionDate: row.session_date,
    weekday: row.weekday as WorkoutSessionRecord["weekday"],
    workoutTemplateId: row.workout_template_id,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    status: row.status,
    durationSeconds: row.duration_seconds,
    notes: row.notes,
    sessionDifficulty: row.session_difficulty,
    performance: row.performance,
  };
}

/**
 * Full (non-sample) session records with performance for a device-local
 * "yyyy-mm-dd" date range, inclusive on both ends. Callers slice this same
 * fetched range for both the weekly and monthly windows rather than
 * re-querying, since 28 days always covers the trailing 7.
 */
export async function fetchSessionRecordsInRange(
  startDate: string,
  endDate: string
): Promise<ActionResult<WorkoutSessionRecord[]>> {
  const context = await getAthleteContext();
  if (!context.ok) return context;
  const { supabase } = context.data;

  try {
    const { data, error } = await supabase
      .from(SESSIONS_TABLE)
      .select("*")
      .gte("session_date", startDate)
      .lte("session_date", endDate)
      .order("session_date", { ascending: true });

    if (error) {
      console.error("[review/actions] Session range lookup failed:", error);
      return { ok: false, reason: "Could not load this window's training history." };
    }

    const rows = ((data as WorkoutSessionDbRow[] | null) ?? [])
      .map(recordFromDbRow)
      .filter((row) => !isSampleSession(row.workoutTemplateId));

    return { ok: true, data: rows };
  } catch (err) {
    console.error("[review/actions] Session range lookup threw:", err);
    return { ok: false, reason: "Could not load this window's training history." };
  }
}
