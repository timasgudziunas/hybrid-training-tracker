"use server";

/**
 * Server actions for the readiness check-in (R7). `readiness_entries` may not
 * exist yet in Supabase (same posture as app/program/actions.ts) — every
 * action here must degrade gracefully on any Supabase error and return a
 * typed failure rather than throwing. Never crash the app because the table
 * isn't there yet.
 */

import { revalidatePath } from "next/cache";
import { getAthleteContext } from "@/lib/auth/athlete-context";

const TABLE = "readiness_entries";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const READINESS_VALUES = ["green", "yellow", "red"] as const;
export type ReadinessColor = (typeof READINESS_VALUES)[number];

export type ActionResult<T> = { ok: true; data: T } | { ok: false; reason: string };

export type ReadinessEntry = {
  date: string;
  sleepHours: number | null;
  energy: number | null;
  soreness: number | null;
  groinStatus: number | null;
  readiness: ReadinessColor | null;
  notes: string | null;
};

export type SaveReadinessInput = {
  date: string;
  sleepHours: number | null;
  energy: number | null;
  soreness: number | null;
  groinStatus: number | null;
  readiness: ReadinessColor | null;
  notes: string | null;
};

type ReadinessRow = {
  entry_date: string;
  sleep_hours: number | null;
  energy: number | null;
  soreness: number | null;
  groin_status: number | null;
  readiness: string | null;
  notes: string | null;
};

function isReadinessColor(value: string | null): value is ReadinessColor {
  return value !== null && (READINESS_VALUES as readonly string[]).includes(value);
}

function fromRow(row: ReadinessRow): ReadinessEntry {
  return {
    date: row.entry_date,
    sleepHours: row.sleep_hours,
    energy: row.energy,
    soreness: row.soreness,
    groinStatus: row.groin_status,
    readiness: isReadinessColor(row.readiness) ? row.readiness : null,
    notes: row.notes,
  };
}

/** A missing-table error from PostgREST/Supabase (schema not applied yet). */
function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "PGRST205" || /relation .* does not exist/i.test(error.message ?? "");
}

function validateInput(input: SaveReadinessInput): string | null {
  if (!DATE_PATTERN.test(input.date)) {
    return "Invalid date.";
  }
  if (input.sleepHours !== null && (!Number.isFinite(input.sleepHours) || input.sleepHours < 0 || input.sleepHours > 24)) {
    return "Enter a valid number of sleep hours.";
  }
  if (input.energy !== null && !(Number.isInteger(input.energy) && input.energy >= 1 && input.energy <= 5)) {
    return "Energy must be between 1 and 5.";
  }
  if (input.soreness !== null && !(Number.isInteger(input.soreness) && input.soreness >= 1 && input.soreness <= 5)) {
    return "Soreness must be between 1 and 5.";
  }
  if (input.groinStatus !== null && !(Number.isInteger(input.groinStatus) && input.groinStatus >= 0 && input.groinStatus <= 5)) {
    return "Groin status must be between 0 and 5.";
  }
  if (input.readiness !== null && !isReadinessColor(input.readiness)) {
    return "Invalid readiness value.";
  }
  return null;
}

/** Upserts today's entry (device-local date, computed by the caller). */
export async function saveReadinessEntry(input: SaveReadinessInput): Promise<ActionResult<ReadinessEntry>> {
  const validationError = validateInput(input);
  if (validationError) {
    return { ok: false, reason: validationError };
  }

  const notes = input.notes && input.notes.trim().length > 0 ? input.notes.trim().slice(0, 2000) : null;

  const context = await getAthleteContext();
  if (!context.ok) return context;
  const { supabase, userId } = context.data;

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .upsert(
        {
          user_id: userId,
          entry_date: input.date,
          sleep_hours: input.sleepHours,
          energy: input.energy,
          soreness: input.soreness,
          groin_status: input.groinStatus,
          readiness: input.readiness,
          notes,
        },
        { onConflict: "user_id,entry_date" }
      )
      .select("*")
      .single();

    if (error) {
      console.error("[readiness/actions] Save failed:", error);
      if (isMissingTableError(error)) {
        return {
          ok: false,
          reason: "The readiness_entries table has not been created yet. Apply supabase/schema.sql, then try again.",
        };
      }
      return { ok: false, reason: "Save failed. Try again." };
    }

    revalidatePath("/readiness");

    return { ok: true, data: fromRow(data as ReadinessRow) };
  } catch (err) {
    console.error("[readiness/actions] saveReadinessEntry threw:", err);
    return { ok: false, reason: "Save failed. Try again." };
  }
}

/** Fetches a single date's entry, or `data: null` if nothing was logged that day. */
export async function getReadinessEntry(date: string): Promise<ActionResult<ReadinessEntry | null>> {
  if (!DATE_PATTERN.test(date)) {
    return { ok: false, reason: "Invalid date." };
  }

  const context = await getAthleteContext();
  if (!context.ok) return context;
  const { supabase } = context.data;

  try {
    const { data, error } = await supabase.from(TABLE).select("*").eq("entry_date", date).maybeSingle();

    if (error) {
      if (isMissingTableError(error)) {
        return { ok: true, data: null };
      }
      console.error("[readiness/actions] getReadinessEntry failed:", error);
      return { ok: false, reason: "Could not load today's entry." };
    }

    return { ok: true, data: data ? fromRow(data as ReadinessRow) : null };
  } catch (err) {
    console.error("[readiness/actions] getReadinessEntry threw:", err);
    return { ok: false, reason: "Could not load today's entry." };
  }
}

const RECENT_DAYS_DEFAULT = 14;

/** Most recent entries, newest first, for the quiet history list and the
 * groin trend check. Defaults to the last two weeks. */
export async function getRecentReadinessEntries(
  days: number = RECENT_DAYS_DEFAULT
): Promise<ActionResult<ReadinessEntry[]>> {
  const context = await getAthleteContext();
  if (!context.ok) return context;
  const { supabase } = context.data;

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("entry_date", { ascending: false })
      .limit(days);

    if (error) {
      if (isMissingTableError(error)) {
        return { ok: true, data: [] };
      }
      console.error("[readiness/actions] getRecentReadinessEntries failed:", error);
      return { ok: false, reason: "Could not load recent entries." };
    }

    return { ok: true, data: ((data as ReadinessRow[] | null) ?? []).map(fromRow) };
  } catch (err) {
    console.error("[readiness/actions] getRecentReadinessEntries threw:", err);
    return { ok: false, reason: "Could not load recent entries." };
  }
}
