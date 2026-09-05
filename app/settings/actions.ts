"use server";

/**
 * Server actions for athlete app settings (R10, 2026-09-04). One row per
 * setting in `athlete_settings` (key/value), shape owned by
 * lib/settings/athlete-settings.ts. Mirrors app/program/actions.ts's
 * degrade-gracefully style: a missing table or read failure must never break
 * a screen that just wants to know whether to show RIR, so fetch always
 * falls back to defaults. Only a thrown credentials error (Supabase not
 * configured) returns ok: false from fetch; every other failure is
 * swallowed into the default settings.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import {
  DEFAULT_ATHLETE_SETTINGS,
  resolveAthleteSettings,
  type AthleteSettings,
} from "@/lib/settings/athlete-settings";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; reason: string };

const TABLE = "athlete_settings";

/** A missing-table error from PostgREST/Supabase (schema not applied yet). */
function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "PGRST205" || /relation .* does not exist/i.test(error.message ?? "");
}

/**
 * Every stored setting, resolved over the defaults. Defaults are the correct
 * behavior when nothing is stored yet, so a missing table or any read error
 * returns the defaults rather than failing the caller (typically the
 * workout screen, which must never be blocked by settings).
 */
export async function fetchAthleteSettings(): Promise<ActionResult<AthleteSettings>> {
  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch (err) {
    console.error("[settings/actions] Supabase client init failed:", err);
    return { ok: false, reason: "Storage is not configured." };
  }

  try {
    const { data, error } = await supabase.from(TABLE).select("key, value");

    if (error) {
      if (!isMissingTableError(error)) {
        console.error("[settings/actions] fetchAthleteSettings failed:", error);
      }
      return { ok: true, data: DEFAULT_ATHLETE_SETTINGS };
    }

    const stored: Record<string, unknown> = {};
    for (const row of (data as { key: string; value: unknown }[] | null) ?? []) {
      stored[row.key] = row.value;
    }

    return { ok: true, data: resolveAthleteSettings(stored) };
  } catch (err) {
    console.error("[settings/actions] fetchAthleteSettings threw:", err);
    return { ok: true, data: DEFAULT_ATHLETE_SETTINGS };
  }
}

/**
 * Upserts one row per key in `patch`, then returns the merged settings.
 * Unlike fetch, a missing table here IS a failure worth surfacing: the
 * athlete just tried to change a setting and it did not save.
 */
export async function updateAthleteSettings(patch: Partial<AthleteSettings>): Promise<ActionResult<AthleteSettings>> {
  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch (err) {
    console.error("[settings/actions] Supabase client init failed:", err);
    return { ok: false, reason: "Storage is not configured." };
  }

  const now = new Date().toISOString();
  const rows = Object.entries(patch).map(([key, value]) => ({ key, value, updated_at: now }));

  if (rows.length === 0) {
    return fetchAthleteSettings();
  }

  try {
    const { error } = await supabase.from(TABLE).upsert(rows, { onConflict: "key" });

    if (error) {
      console.error("[settings/actions] updateAthleteSettings failed:", error);
      if (isMissingTableError(error)) {
        return {
          ok: false,
          reason: "The athlete_settings table has not been applied yet. Run supabase/schema.sql in the Supabase SQL editor.",
        };
      }
      return { ok: false, reason: "Could not save settings." };
    }

    return fetchAthleteSettings();
  } catch (err) {
    console.error("[settings/actions] updateAthleteSettings threw:", err);
    return { ok: false, reason: "Could not save settings." };
  }
}
