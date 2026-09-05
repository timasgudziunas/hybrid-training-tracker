import { NextResponse, type NextRequest } from "next/server";
import { createUserSupabaseClient } from "@/lib/supabase/user-client";
import { safeRedirectPath } from "@/lib/auth/safe-redirect-path";

/** Lands the email confirmation link (Supabase PKCE flow): swaps the one-time
 * code for a session cookie, then continues into the app. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const redirectPath = safeRedirectPath(request.nextUrl.searchParams.get("redirect"));

  if (code) {
    const supabase = await createUserSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
    console.error("[auth/callback] exchangeCodeForSession failed:", error.message);
  }

  const signInUrl = new URL("/sign-in", request.url);
  signInUrl.searchParams.set("notice", "confirmation-failed");
  return NextResponse.redirect(signInUrl);
}
