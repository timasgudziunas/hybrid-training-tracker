import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Server-only: a Supabase client bound to the signed-in athlete's session
// (accounts, 2026-09-05). It uses the anon key plus the auth cookies that
// @supabase/ssr maintains, so every query runs as that user and Postgres RLS
// (supabase/schema.sql) limits it to rows where user_id = auth.uid().
//
// Use this for ALL athlete data access. The service-role client in
// server-client.ts bypasses RLS and is now reserved for storage signing and
// admin scripts.
if (typeof window !== "undefined") {
  throw new Error("lib/supabase/user-client.ts must never be imported into client code.");
}

export async function createUserSupabaseClient(): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase credentials are not configured.");
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // proxy.ts refreshes the session cookies on every request, so
          // nothing is lost by skipping the write here.
        }
      },
    },
  });
}
