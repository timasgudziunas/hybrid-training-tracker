"use server";

/**
 * Server actions for the paste-a-program feature (2026-08-25 rework, R1).
 * `training_programs` may not exist yet in Supabase (the owner applies the
 * updated supabase/schema.sql by hand, same as workout_sessions was) — every
 * action here must degrade gracefully on any Supabase error and return a
 * typed failure rather than throwing. Never crash the app because the table
 * isn't there yet.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import { parseProgramText } from "@/lib/program/parse-program-text";
import type { ResolvedProgram } from "@/lib/program/program-types";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; reason: string };

const TABLE = "training_programs";

export interface ProgramRecord {
  id: string;
  name: string;
  sourceText: string;
  parsed: ResolvedProgram;
  isActive: boolean;
  createdAt: string;
}

type ProgramDbRow = {
  id: string;
  name: string;
  source_text: string;
  parsed: ResolvedProgram;
  is_active: boolean;
  created_at: string;
};

function fromDbRow(row: ProgramDbRow): ProgramRecord {
  return {
    id: row.id,
    name: row.name,
    sourceText: row.source_text,
    parsed: row.parsed,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

/** A missing-table error from PostgREST/Supabase (schema not applied yet). */
function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "PGRST205" || /relation .* does not exist/i.test(error.message ?? "");
}

/** Parses `sourceText` without saving anything, for the paste screen's live
 * preview. Always returns `ok: true` — parse errors/warnings are data, not a
 * failure of this action. */
export async function previewProgram(
  sourceText: string
): Promise<ActionResult<{ program?: ResolvedProgram; errors: string[]; warnings: string[] }>> {
  const result = parseProgramText(sourceText);
  return { ok: true, data: result };
}

/**
 * Parses `sourceText` and, only if it parses with zero errors, inserts a new
 * row and activates it (deactivating every other row first). History is
 * kept — nothing is ever deleted here, so a paste can always be rolled back
 * via activateProgram.
 */
export async function saveProgram(
  sourceText: string
): Promise<ActionResult<{ program: ResolvedProgram; warnings: string[]; id: string }>> {
  const { program, errors, warnings } = parseProgramText(sourceText);

  if (!program) {
    return { ok: false, reason: `Could not save: ${errors.join(" ")}` };
  }

  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch (err) {
    console.error("[program/actions] Supabase client init failed:", err);
    return { ok: false, reason: "Storage is not configured." };
  }

  try {
    // Insert first, inactive, so a failure partway through never leaves the
    // athlete with NO active program: the new row is safely in history even
    // if the activation steps below fail, and can be activated by hand.
    const { data, error: insertError } = await supabase
      .from(TABLE)
      .insert({
        name: program.name,
        source_text: sourceText,
        parsed: program,
        is_active: false,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[program/actions] Insert program failed:", insertError);
      if (isMissingTableError(insertError)) {
        return {
          ok: false,
          reason: "The training_programs table has not been created yet. Apply supabase/schema.sql, then try again.",
        };
      }
      return { ok: false, reason: "Could not save the program." };
    }

    const id = (data as { id: string }).id;

    const { error: deactivateError } = await supabase.from(TABLE).update({ is_active: false }).eq("is_active", true);
    if (deactivateError) {
      console.error("[program/actions] Deactivate existing programs failed:", deactivateError);
      return {
        ok: false,
        reason: "Saved, but could not switch the active program. Activate it from the history list below.",
      };
    }

    const { error: activateError } = await supabase.from(TABLE).update({ is_active: true }).eq("id", id);
    if (activateError) {
      console.error("[program/actions] Activate new program failed:", activateError);
      return {
        ok: false,
        reason: "Saved, but could not activate it. Activate it from the history list below.",
      };
    }

    return { ok: true, data: { program, warnings, id } };
  } catch (err) {
    console.error("[program/actions] saveProgram threw:", err);
    return { ok: false, reason: "Could not save the program." };
  }
}

/** The single active program, or `data: null` when none has ever been
 * activated (not a failure — the Today screen falls back to the sample). */
export async function fetchActiveProgram(): Promise<ActionResult<ProgramRecord | null>> {
  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch (err) {
    console.error("[program/actions] Supabase client init failed:", err);
    return { ok: false, reason: "Storage is not configured." };
  }

  try {
    const { data, error } = await supabase.from(TABLE).select("*").eq("is_active", true).limit(1);

    if (error) {
      if (isMissingTableError(error)) {
        return { ok: true, data: null };
      }
      console.error("[program/actions] fetchActiveProgram failed:", error);
      return { ok: false, reason: "Could not load the active program." };
    }

    const row = data?.[0] as ProgramDbRow | undefined;
    return { ok: true, data: row ? fromDbRow(row) : null };
  } catch (err) {
    console.error("[program/actions] fetchActiveProgram threw:", err);
    return { ok: false, reason: "Could not load the active program." };
  }
}

/** Every program ever saved, newest first, for the history list + re-activate. */
export async function fetchProgramHistory(): Promise<ActionResult<ProgramRecord[]>> {
  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch (err) {
    console.error("[program/actions] Supabase client init failed:", err);
    return { ok: false, reason: "Storage is not configured." };
  }

  try {
    const { data, error } = await supabase.from(TABLE).select("*").order("created_at", { ascending: false });

    if (error) {
      if (isMissingTableError(error)) {
        return { ok: true, data: [] };
      }
      console.error("[program/actions] fetchProgramHistory failed:", error);
      return { ok: false, reason: "Could not load program history." };
    }

    return { ok: true, data: ((data as ProgramDbRow[] | null) ?? []).map(fromDbRow) };
  } catch (err) {
    console.error("[program/actions] fetchProgramHistory threw:", err);
    return { ok: false, reason: "Could not load program history." };
  }
}

/** Re-activates a previously saved program (a paste rollback): deactivates
 * every other row, activates this one. The row's already-parsed content is
 * reused as-is; it is not re-parsed. */
export async function activateProgram(id: string): Promise<ActionResult<null>> {
  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch (err) {
    console.error("[program/actions] Supabase client init failed:", err);
    return { ok: false, reason: "Storage is not configured." };
  }

  try {
    const { error: deactivateError } = await supabase.from(TABLE).update({ is_active: false }).eq("is_active", true);
    if (deactivateError) {
      console.error("[program/actions] Deactivate existing programs failed:", deactivateError);
      return { ok: false, reason: "Could not deactivate the previous program." };
    }

    const { error: activateError } = await supabase.from(TABLE).update({ is_active: true }).eq("id", id);
    if (activateError) {
      console.error("[program/actions] Activate program failed:", activateError);
      return { ok: false, reason: "Could not activate that program." };
    }

    return { ok: true, data: null };
  } catch (err) {
    console.error("[program/actions] activateProgram threw:", err);
    return { ok: false, reason: "Could not activate that program." };
  }
}
