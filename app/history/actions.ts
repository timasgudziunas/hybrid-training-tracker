"use server";

/**
 * Server actions for the History calendar + day drill-down (R4). Mirrors
 * app/workout/actions.ts's data-access style exactly: every action must
 * degrade gracefully on any Supabase error (missing table, missing
 * permissions, network failure) and return a typed failure rather than
 * throwing, so History renders an empty/explanatory state instead of
 * crashing. Read-only: this file never writes to Supabase.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import { groupSessionsByDate } from "@/lib/history/session-filtering";
import type { WorkoutSessionRecord, WorkoutSessionStatus } from "@/lib/workout-session/workout-session-types";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; reason: string };

const SESSIONS_TABLE = "workout_sessions";
const CHECKINS_TABLE = "body_checkins";

/** Lightweight per-day summary for the calendar — deliberately excludes the
 * `performance` jsonb blob (only the day drill-down page needs the full
 * record), so the calendar's client bundle stays small. */
export interface SessionSummary {
  id: string;
  sessionDate: string;
  weekday: string;
  workoutTemplateId: string;
  status: WorkoutSessionStatus;
  startedAt: string;
}

type SessionSummaryDbRow = {
  id: string;
  session_date: string;
  weekday: string;
  workout_template_id: string;
  status: WorkoutSessionStatus;
  started_at: string;
};

function summaryFromDbRow(row: SessionSummaryDbRow): SessionSummary {
  return {
    id: row.id,
    sessionDate: row.session_date,
    weekday: row.weekday,
    workoutTemplateId: row.workout_template_id,
    status: row.status,
    startedAt: row.started_at,
  };
}

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
 * Session summaries for the calendar. `startDate`/`endDate` (inclusive,
 * "yyyy-mm-dd") narrow the query when supplied; omitted, the query is
 * unbounded, which is fine at this app's scale (schema.sql: "a single
 * athlete, a few hundred sessions a year"). Callers pick one representative
 * row per date and exclude sample-workout rows via
 * lib/history/session-filtering.ts — this action just returns the raw rows.
 */
export async function fetchSessionSummaries(
  startDate?: string,
  endDate?: string
): Promise<ActionResult<SessionSummary[]>> {
  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch (err) {
    console.error("[history/actions] Supabase client init failed:", err);
    return { ok: false, reason: "Storage is not configured." };
  }

  try {
    let query = supabase
      .from(SESSIONS_TABLE)
      .select("id, session_date, weekday, workout_template_id, status, started_at")
      .order("session_date", { ascending: true });

    if (startDate) query = query.gte("session_date", startDate);
    if (endDate) query = query.lte("session_date", endDate);

    const { data, error } = await query;

    if (error) {
      console.error("[history/actions] Session summaries lookup failed:", error);
      return { ok: false, reason: "Could not load training history." };
    }

    return { ok: true, data: ((data as SessionSummaryDbRow[] | null) ?? []).map(summaryFromDbRow) };
  } catch (err) {
    console.error("[history/actions] Session summaries lookup threw:", err);
    return { ok: false, reason: "Could not load training history." };
  }
}

/**
 * The full historical record for one calendar date, for the day drill-down
 * page. Excludes sample-workout rows and picks the single representative
 * row when more than one exists for the date (CLAUDE.md edge case:
 * duplicate workout) — same rule the calendar uses, so a day that links
 * here always resolves to the same row. `data: null` means nothing real was
 * ever logged that day (not a failure).
 */
export async function fetchSessionForDate(sessionDate: string): Promise<ActionResult<WorkoutSessionRecord | null>> {
  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch (err) {
    console.error("[history/actions] Supabase client init failed:", err);
    return { ok: false, reason: "Storage is not configured." };
  }

  try {
    const { data, error } = await supabase.from(SESSIONS_TABLE).select("*").eq("session_date", sessionDate);

    if (error) {
      console.error("[history/actions] Session-for-date lookup failed:", error);
      return { ok: false, reason: "Could not load that day's record." };
    }

    const rows = ((data as WorkoutSessionDbRow[] | null) ?? []).map(recordFromDbRow);
    const byDate = groupSessionsByDate(
      rows.map((row) => ({
        id: row.id,
        sessionDate: row.sessionDate,
        workoutTemplateId: row.workoutTemplateId,
        status: row.status,
        startedAt: row.startedAt,
      }))
    );
    const representative = byDate.get(sessionDate);
    if (!representative) {
      return { ok: true, data: null };
    }

    return { ok: true, data: rows.find((row) => row.id === representative.id) ?? null };
  } catch (err) {
    console.error("[history/actions] Session-for-date lookup threw:", err);
    return { ok: false, reason: "Could not load that day's record." };
  }
}

/** Every body check-in date logged, for the calendar's small secondary
 * indicator. `data: []` (not a failure) when the table doesn't exist yet or
 * nothing has been logged. */
export async function fetchBodyCheckinDates(): Promise<ActionResult<string[]>> {
  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch (err) {
    console.error("[history/actions] Supabase client init failed:", err);
    return { ok: false, reason: "Storage is not configured." };
  }

  try {
    const { data, error } = await supabase.from(CHECKINS_TABLE).select("checkin_date");

    if (error) {
      console.error("[history/actions] Body check-in dates lookup failed:", error);
      return { ok: true, data: [] };
    }

    return { ok: true, data: ((data as { checkin_date: string }[] | null) ?? []).map((row) => row.checkin_date) };
  } catch (err) {
    console.error("[history/actions] Body check-in dates lookup threw:", err);
    return { ok: true, data: [] };
  }
}
