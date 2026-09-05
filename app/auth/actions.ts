"use server";

/**
 * Sign-in, sign-up, and sign-out (accounts, 2026-09-05). Supabase Auth with
 * email + password; the session lives in cookies managed by @supabase/ssr.
 *
 * Sign-up is optionally gated by APP_PASSPHRASE (the former single-user
 * gate, reused as an invite passphrase): when it is set, a new account needs
 * it; when it is unset, anyone can sign up. Signing IN never needs it.
 */

import { redirect } from "next/navigation";
import { createUserSupabaseClient } from "@/lib/supabase/user-client";
import { safeRedirectPath } from "@/lib/auth/safe-redirect-path";

export type AuthFormState = { error?: string; notice?: string };

const MIN_PASSWORD_LENGTH = 8;

function readString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/** Public origin for links in auth emails: explicit env first, then the
 * Vercel deployment host, then local dev. */
function siteOrigin(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export async function signInAction(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = readString(formData, "email");
  const password = formData.get("password");
  const redirectPath = safeRedirectPath(formData.get("redirect"));

  if (!email || typeof password !== "string" || password.length === 0) {
    return { error: "Enter your email and password." };
  }

  let supabase;
  try {
    supabase = await createUserSupabaseClient();
  } catch (err) {
    console.error("[auth/actions] Supabase client init failed:", err);
    return { error: "Sign-in is not configured on the server." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: "Confirm your email first. Check your inbox for the confirmation link." };
    }
    return { error: "Wrong email or password." };
  }

  redirect(redirectPath);
}

export async function signUpAction(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = readString(formData, "email");
  const password = formData.get("password");
  const invite = readString(formData, "invite");
  const redirectPath = safeRedirectPath(formData.get("redirect"));

  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email." };
  }
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Use a password of at least ${MIN_PASSWORD_LENGTH} characters.` };
  }

  const requiredInvite = process.env.APP_PASSPHRASE;
  if (requiredInvite && invite !== requiredInvite) {
    return { error: "Wrong invite passphrase." };
  }

  let supabase;
  try {
    supabase = await createUserSupabaseClient();
  } catch (err) {
    console.error("[auth/actions] Supabase client init failed:", err);
    return { error: "Sign-up is not configured on the server." };
  }

  const callbackUrl = `${siteOrigin()}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: callbackUrl },
  });

  if (error) {
    console.error("[auth/actions] signUp failed:", error.code, error.message);
    if (error.code === "user_already_exists" || error.code === "email_exists") {
      return { error: "An account with that email already exists. Sign in instead." };
    }
    if (error.code === "weak_password") {
      return { error: "That password is too weak. Try a longer one." };
    }
    return { error: "Could not create the account. Try again." };
  }

  // With "Confirm email" on in Supabase Auth settings there is no session yet.
  if (!data.session) {
    return { notice: "Account created. Check your email for the confirmation link, then sign in." };
  }

  redirect(redirectPath);
}

export async function signOutAction(): Promise<void> {
  try {
    const supabase = await createUserSupabaseClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error("[auth/actions] signOut failed:", err);
  }
  redirect("/sign-in");
}
