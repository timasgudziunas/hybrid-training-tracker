import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only: this module reads SUPABASE_SERVICE_ROLE_KEY, which must never
// reach the client bundle. Only import it from server actions, route
// handlers, or Server Components.
//
// Since accounts (2026-09-05), this service-role client bypasses RLS and is
// reserved for storage signing (progress photos) and admin scripts. All
// athlete data access goes through lib/supabase/user-client.ts instead, so
// Postgres RLS (supabase/schema.sql) scopes every query to the signed-in
// user.
if (typeof window !== "undefined") {
  throw new Error("lib/supabase/server-client.ts must never be imported into client code.");
}

export function createServerSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase server credentials are not configured.");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
