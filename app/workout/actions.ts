"use server";

/**
 * Server actions for active workout persistence. The `workout_sessions`
 * table does not exist in Supabase yet (the owner applies
 * supabase/schema.sql by hand) — every action here must degrade
 * gracefully on any Supabase error (missing table, missing permissions,
 * network failure) and return a typed failure rather than throwing, so the
 * workout keeps running on the localStorage mirror alone. Never crash the
 * workout because the DB isn't ready.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import type {
  PreviousPerformanceByExercise,
  SetLog,
  WorkoutSessionRecord,
  WorkoutSessionStatus,
} from "@/lib/workout-session/workout-session-types";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; reason: string };

const TABLE = "workout_sessions";

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

function toDbRow(record: WorkoutSessionRecord): WorkoutSessionDbRow {
  return {
    id: record.id,
    session_date: record.sessionDate,
    weekday: record.weekday,
    workout_template_id: record.workoutTemplateId,
    started_at: record.startedAt,
    completed_at: record.completedAt,
    status: record.status,
    duration_seconds: record.durationSeconds,
    notes: record.notes,
    session_difficulty: record.sessionDifficulty,
    performance: record.performance,
  };
}

function fromDbRow(row: WorkoutSessionDbRow): WorkoutSessionRecord {
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

/** Continuous autosave target (Start Workout, every debounced mutation, and
 * Finish all call this with the full current record — a single idempotent
 * upsert by id). */
export async function saveWorkoutSession(record: WorkoutSessionRecord): Promise<ActionResult<null>> {
  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch (err) {
    console.error("[workout/actions] Supabase client init failed:", err);
    return { ok: false, reason: "Storage is not configured." };
  }

  try {
    const { error } = await supabase.from(TABLE).upsert(toDbRow(record), { onConflict: "id" });
    if (error) {
      console.error("[workout/actions] Session upsert failed:", error);
      return { ok: false, reason: "Not synced yet." };
    }
    return { ok: true, data: null };
  } catch (err) {
    console.error("[workout/actions] Session upsert threw:", err);
    return { ok: false, reason: "Not synced yet." };
  }
}

/** Looks up a resumable session for today: most recent active/modified row
 * for this calendar date. Returns `data: null` (not a failure) when there
 * simply isn't one yet. */
export async function fetchActiveSessionForToday(sessionDate: string): Promise<ActionResult<WorkoutSessionRecord | null>> {
  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch (err) {
    console.error("[workout/actions] Supabase client init failed:", err);
    return { ok: false, reason: "Storage is not configured." };
  }

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("session_date", sessionDate)
      .in("status", ["active", "modified"])
      .order("started_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("[workout/actions] Active session lookup failed:", error);
      return { ok: false, reason: "Could not check for an active session." };
    }

    const row = data?.[0] as WorkoutSessionDbRow | undefined;
    return { ok: true, data: row ? fromDbRow(row) : null };
  } catch (err) {
    console.error("[workout/actions] Active session lookup threw:", err);
    return { ok: false, reason: "Could not check for an active session." };
  }
}

/** Previous performance per exercise (PRODUCT_SPEC §7): the most recent
 * prior completed/modified session for this program template, keyed by the
 * exercise actually performed (so it still shows correctly if the athlete
 * picked a different "or" alternative last time). */
export async function fetchPreviousPerformance(
  workoutTemplateId: string,
  beforeDate: string
): Promise<ActionResult<PreviousPerformanceByExercise>> {
  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch (err) {
    console.error("[workout/actions] Supabase client init failed:", err);
    return { ok: false, reason: "Storage is not configured." };
  }

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("performance")
      .eq("workout_template_id", workoutTemplateId)
      .lt("session_date", beforeDate)
      .in("status", ["completed", "modified"])
      .order("session_date", { ascending: false })
      .limit(1);

    if (error) {
      console.error("[workout/actions] Previous performance lookup failed:", error);
      return { ok: false, reason: "Could not load previous performance." };
    }

    const row = data?.[0] as { performance: WorkoutSessionRecord["performance"] } | undefined;
    if (!row) {
      return { ok: true, data: {} };
    }

    const byExercise: PreviousPerformanceByExercise = {};
    for (const slot of Object.values(row.performance.slots ?? {})) {
      if (!slot.chosenExerciseId || slot.sets.length === 0) continue;
      byExercise[slot.chosenExerciseId] = slot.sets.filter((set): set is SetLog => Boolean(set));
    }

    return { ok: true, data: byExercise };
  } catch (err) {
    console.error("[workout/actions] Previous performance lookup threw:", err);
    return { ok: false, reason: "Could not load previous performance." };
  }
}
