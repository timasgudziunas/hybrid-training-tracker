"use server";

/**
 * Server actions for the progress dashboards (R5). `athletic_benchmarks` may
 * not exist yet in Supabase (same posture as app/program/actions.ts for
 * training_programs) — every action here degrades gracefully on any Supabase
 * error and returns a typed failure rather than throwing. Never crash the
 * page because the table isn't there yet.
 */

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import { getBenchmarkDefinition } from "@/lib/benchmarks/benchmark-definitions";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; reason: string };

const BENCHMARKS_TABLE = "athletic_benchmarks";
const BODY_CHECKINS_TABLE = "body_checkins";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_NOTES_LENGTH = 500;

const MISSING_TABLE_REASON =
  "The athletic_benchmarks table has not been created yet. Apply supabase/schema.sql, then try again.";

export interface BenchmarkEntry {
  id: string;
  type: string;
  measuredOn: string;
  value: number;
  unit: string;
  notes: string | null;
  createdAt: string;
}

type BenchmarkDbRow = {
  id: string;
  benchmark_type: string;
  measured_on: string;
  value: number;
  unit: string;
  notes: string | null;
  created_at: string;
};

function fromDbRow(row: BenchmarkDbRow): BenchmarkEntry {
  return {
    id: row.id,
    type: row.benchmark_type,
    measuredOn: row.measured_on,
    value: row.value,
    unit: row.unit,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

/** A missing-table error from PostgREST/Supabase (schema not applied yet).
 * Mirrors app/program/actions.ts's isMissingTableError. */
function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "PGRST205" || /relation .* does not exist/i.test(error.message ?? "");
}

export interface LogBenchmarkInput {
  type: string;
  measuredOn: string;
  value: number;
  notes?: string;
}

/** Validates and inserts one benchmark measurement. Value bounds and, for
 * ordinal-level benchmarks (planche), the set of valid levels come straight
 * from the benchmark's own definition, never duplicated here. */
export async function logBenchmarkEntry(input: LogBenchmarkInput): Promise<ActionResult<BenchmarkEntry>> {
  const definition = getBenchmarkDefinition(input.type);
  if (!definition) {
    return { ok: false, reason: "Unknown benchmark type." };
  }
  if (!DATE_PATTERN.test(input.measuredOn)) {
    return { ok: false, reason: "Enter a valid date." };
  }
  if (!Number.isFinite(input.value)) {
    return { ok: false, reason: "Enter a valid value." };
  }

  if (definition.input.kind === "numeric") {
    if (input.value < definition.input.min || input.value > definition.input.max) {
      return { ok: false, reason: `Enter a value between ${definition.input.min} and ${definition.input.max}.` };
    }
  } else {
    const validLevel = definition.input.levels.some((level) => level.order === input.value);
    if (!validLevel) {
      return { ok: false, reason: "Pick a valid progression level." };
    }
  }

  const notes = input.notes && input.notes.trim().length > 0 ? input.notes.trim().slice(0, MAX_NOTES_LENGTH) : null;

  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch (err) {
    console.error("[progress/actions] Supabase client init failed:", err);
    return { ok: false, reason: "Storage is not configured." };
  }

  try {
    const { data, error } = await supabase
      .from(BENCHMARKS_TABLE)
      .insert({
        benchmark_type: definition.type,
        measured_on: input.measuredOn,
        value: input.value,
        unit: definition.unit,
        notes,
      })
      .select("*")
      .single();

    if (error) {
      console.error("[progress/actions] Insert benchmark failed:", error);
      if (isMissingTableError(error)) {
        return { ok: false, reason: MISSING_TABLE_REASON };
      }
      return { ok: false, reason: "Could not save the measurement." };
    }

    revalidatePath("/progress");

    return { ok: true, data: fromDbRow(data as BenchmarkDbRow) };
  } catch (err) {
    console.error("[progress/actions] logBenchmarkEntry threw:", err);
    return { ok: false, reason: "Could not save the measurement." };
  }
}

export interface BenchmarkEntriesResult {
  /** Every logged entry, grouped by benchmark type, oldest to newest within
   * each group so chart components can consume it directly. */
  entries: Record<string, BenchmarkEntry[]>;
  /** True only when athletic_benchmarks does not exist yet: distinct from an
   * empty result, so the page can show a "schema needs applying" banner
   * rather than a plain "no measurements yet" empty state. */
  schemaMissing: boolean;
}

export async function fetchBenchmarkEntries(): Promise<ActionResult<BenchmarkEntriesResult>> {
  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch (err) {
    console.error("[progress/actions] Supabase client init failed:", err);
    return { ok: false, reason: "Storage is not configured." };
  }

  try {
    const { data, error } = await supabase
      .from(BENCHMARKS_TABLE)
      .select("*")
      .order("measured_on", { ascending: true });

    if (error) {
      if (isMissingTableError(error)) {
        return { ok: true, data: { entries: {}, schemaMissing: true } };
      }
      console.error("[progress/actions] fetchBenchmarkEntries failed:", error);
      return { ok: false, reason: "Could not load benchmark history." };
    }

    const entries: Record<string, BenchmarkEntry[]> = {};
    for (const row of (data as BenchmarkDbRow[] | null) ?? []) {
      const entry = fromDbRow(row);
      (entries[entry.type] ??= []).push(entry);
    }

    return { ok: true, data: { entries, schemaMissing: false } };
  } catch (err) {
    console.error("[progress/actions] fetchBenchmarkEntries threw:", err);
    return { ok: false, reason: "Could not load benchmark history." };
  }
}

export interface BodyweightPoint {
  date: string;
  weightLbs: number;
}

/** Bodyweight series from body_checkins, oldest to newest, for the
 * athleticism-vs-bodyweight view. `data: []` (not a failure) if the table is
 * ever missing, matching fetchBenchmarkEntries's degradation shape. */
export async function fetchBodyweightSeries(): Promise<ActionResult<BodyweightPoint[]>> {
  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch (err) {
    console.error("[progress/actions] Supabase client init failed:", err);
    return { ok: false, reason: "Storage is not configured." };
  }

  try {
    const { data, error } = await supabase
      .from(BODY_CHECKINS_TABLE)
      .select("checkin_date, weight_lbs")
      .order("checkin_date", { ascending: true });

    if (error) {
      if (isMissingTableError(error)) {
        return { ok: true, data: [] };
      }
      console.error("[progress/actions] fetchBodyweightSeries failed:", error);
      return { ok: false, reason: "Could not load bodyweight history." };
    }

    const rows = (data as { checkin_date: string; weight_lbs: number }[] | null) ?? [];
    return { ok: true, data: rows.map((row) => ({ date: row.checkin_date, weightLbs: row.weight_lbs })) };
  } catch (err) {
    console.error("[progress/actions] fetchBodyweightSeries threw:", err);
    return { ok: false, reason: "Could not load bodyweight history." };
  }
}
