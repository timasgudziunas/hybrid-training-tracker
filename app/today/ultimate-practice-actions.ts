"use server";

/**
 * Server actions for Ultimate practice attendance (2026-08-26). The program
 * flag `ultimatePracticeLater` on a day template only means practice is
 * SCHEDULED that day; this table records days the athlete actually checked
 * in-app as attended. Mirrors app/history/actions.ts's degrade-gracefully
 * style exactly: every action returns a typed ActionResult rather than
 * throwing.
 */

import { getAthleteContext } from "@/lib/auth/athlete-context";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; reason: string };

const TABLE = "ultimate_practice_days";

/** Whether the given device-local "yyyy-mm-dd" date has an attendance row. */
export async function getUltimatePracticeDay(date: string): Promise<ActionResult<boolean>> {
  const context = await getAthleteContext();
  if (!context.ok) return context;
  const { supabase } = context.data;

  try {
    const { data, error } = await supabase.from(TABLE).select("id").eq("practice_date", date).limit(1);

    if (error) {
      console.error("[today/ultimate-practice-actions] Ultimate practice day lookup failed:", error);
      return { ok: false, reason: "Could not load Ultimate practice status." };
    }

    return { ok: true, data: (data ?? []).length > 0 };
  } catch (err) {
    console.error("[today/ultimate-practice-actions] Ultimate practice day lookup threw:", err);
    return { ok: false, reason: "Could not load Ultimate practice status." };
  }
}

/**
 * Records or clears attendance for a device-local "yyyy-mm-dd" date.
 * Attended true: upserts a row, ignoring the conflict if one already exists
 * (checking twice is a no-op, not an error). Attended false: deletes the row
 * (unchecking deletes, per the schema comment).
 */
export async function setUltimatePracticeAttended(date: string, attended: boolean): Promise<ActionResult<boolean>> {
  const context = await getAthleteContext();
  if (!context.ok) return context;
  const { supabase, userId } = context.data;

  try {
    if (attended) {
      const { error } = await supabase
        .from(TABLE)
        .upsert(
          { user_id: userId, practice_date: date },
          { onConflict: "user_id,practice_date", ignoreDuplicates: true }
        );

      if (error) {
        console.error("[today/ultimate-practice-actions] Ultimate practice day upsert failed:", error);
        return { ok: false, reason: "Could not save Ultimate practice. Try again." };
      }
    } else {
      const { error } = await supabase.from(TABLE).delete().eq("practice_date", date);

      if (error) {
        console.error("[today/ultimate-practice-actions] Ultimate practice day delete failed:", error);
        return { ok: false, reason: "Could not save Ultimate practice. Try again." };
      }
    }

    return { ok: true, data: attended };
  } catch (err) {
    console.error("[today/ultimate-practice-actions] Ultimate practice day save threw:", err);
    return { ok: false, reason: "Could not save Ultimate practice. Try again." };
  }
}

/**
 * Every attended date, for the History calendar's dot and the Review
 * dashboard's weekly count. `startDate`/`endDate` (inclusive, "yyyy-mm-dd")
 * narrow the query when supplied; omitted, the query is unbounded. `data: []`
 * (not a failure) when the table doesn't exist yet or nothing is logged, same
 * forgiving posture as fetchBodyCheckinDates in app/history/actions.ts, so
 * History and Review render without this table existing yet.
 */
export async function fetchUltimatePracticeDates(startDate?: string, endDate?: string): Promise<ActionResult<string[]>> {
  const context = await getAthleteContext();
  if (!context.ok) return context;
  const { supabase } = context.data;

  try {
    let query = supabase.from(TABLE).select("practice_date");

    if (startDate) query = query.gte("practice_date", startDate);
    if (endDate) query = query.lte("practice_date", endDate);

    const { data, error } = await query;

    if (error) {
      console.error("[today/ultimate-practice-actions] Ultimate practice dates lookup failed:", error);
      return { ok: true, data: [] };
    }

    return { ok: true, data: ((data as { practice_date: string }[] | null) ?? []).map((row) => row.practice_date) };
  } catch (err) {
    console.error("[today/ultimate-practice-actions] Ultimate practice dates lookup threw:", err);
    return { ok: true, data: [] };
  }
}
