import type { SupabaseClient } from "@supabase/supabase-js";
import { createUserSupabaseClient } from "@/lib/supabase/user-client";

/**
 * The signed-in athlete plus a Supabase client scoped to them (accounts,
 * 2026-09-05). Every server action and Server Component that touches
 * athlete data starts with getAthleteContext(); a failure means "not signed
 * in" or "Supabase not configured" and is returned in the same
 * { ok: false, reason } shape every action already uses.
 *
 * `userId` is what rows carry in their user_id column. Inserts and upserts
 * should set it explicitly (the column also defaults to auth.uid(), but an
 * upsert's onConflict target needs the value present in the row).
 */
export interface AthleteContext {
  supabase: SupabaseClient;
  userId: string;
  email: string | null;
}

export type AthleteContextResult = { ok: true; data: AthleteContext } | { ok: false; reason: string };

export const SIGNED_OUT_REASON = "You are signed out. Sign in again to continue.";

export async function getAthleteContext(): Promise<AthleteContextResult> {
  let supabase: SupabaseClient;
  try {
    supabase = await createUserSupabaseClient();
  } catch (err) {
    // Next.js signals "this route must render dynamically" by throwing from
    // cookies(); that must propagate, never be swallowed into a failure.
    if (typeof err === "object" && err !== null && "digest" in err && err.digest === "DYNAMIC_SERVER_USAGE") {
      throw err;
    }
    console.error("[auth/athlete-context] Supabase client init failed:", err);
    return { ok: false, reason: "Storage is not configured." };
  }

  // getUser() verifies the token with the Auth server rather than trusting
  // the cookie payload; the cookie alone must never establish identity.
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { ok: false, reason: SIGNED_OUT_REASON };
  }

  return { ok: true, data: { supabase, userId: data.user.id, email: data.user.email ?? null } };
}
