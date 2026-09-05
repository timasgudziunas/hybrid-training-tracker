"use server";

/**
 * Bodyweight series for the Review dashboards. Split out of the old
 * app/progress/actions.ts when athletic benchmarks were removed from the
 * app 2026-09-05 (owner decision) — this is the one piece of that file that
 * Review still needs. Uses the per-user Supabase access contract (accounts,
 * 2026-09-05): rows are already scoped to the signed-in athlete by RLS, so
 * no explicit user_id filter is needed on selects.
 */

import { getAthleteContext } from "@/lib/auth/athlete-context";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; reason: string };

const BODY_CHECKINS_TABLE = "body_checkins";

/** A missing-table error from PostgREST/Supabase (schema not applied yet). */
function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "PGRST205" || /relation .* does not exist/i.test(error.message ?? "");
}

export interface BodyweightPoint {
  date: string;
  weightLbs: number;
}

/** Bodyweight series from body_checkins, oldest to newest, for the review
 * dashboards. `data: []` (not a failure) if the table is ever missing. */
export async function fetchBodyweightSeries(): Promise<ActionResult<BodyweightPoint[]>> {
  const context = await getAthleteContext();
  if (!context.ok) return context;
  const { supabase } = context.data;

  try {
    const { data, error } = await supabase
      .from(BODY_CHECKINS_TABLE)
      .select("checkin_date, weight_lbs")
      .order("checkin_date", { ascending: true });

    if (error) {
      if (isMissingTableError(error)) {
        return { ok: true, data: [] };
      }
      console.error("[body/bodyweight-series-actions] fetchBodyweightSeries failed:", error);
      return { ok: false, reason: "Could not load bodyweight history." };
    }

    const rows = (data as { checkin_date: string; weight_lbs: number }[] | null) ?? [];
    return { ok: true, data: rows.map((row) => ({ date: row.checkin_date, weightLbs: row.weight_lbs })) };
  } catch (err) {
    console.error("[body/bodyweight-series-actions] fetchBodyweightSeries threw:", err);
    return { ok: false, reason: "Could not load bodyweight history." };
  }
}
