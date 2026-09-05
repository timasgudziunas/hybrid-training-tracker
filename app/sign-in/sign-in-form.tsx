"use client";

import { useActionState, useEffect } from "react";
import { signInAction, type AuthFormState } from "@/app/auth/actions";
import { AUTH_INPUT_CLASS, AUTH_SUBMIT_CLASS } from "@/app/auth/auth-field-styles";
import { clearLocalAthleteData } from "@/app/auth/clear-local-athlete-data";

const initialState: AuthFormState = {};

export default function SignInForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction, isPending] = useActionState(signInAction, initialState);

  // Reaching the sign-in screen means no account is signed in on this
  // browser, so any leftover local workout data belongs to nobody: clear it
  // before whoever signs in next could resume it.
  useEffect(() => {
    clearLocalAthleteData();
  }, []);

  return (
    <form action={formAction} className="flex w-full max-w-xs flex-col gap-3">
      <input type="hidden" name="redirect" value={redirectTo} />
      <input
        type="email"
        name="email"
        autoComplete="email"
        inputMode="email"
        placeholder="Email"
        required
        className={AUTH_INPUT_CLASS}
      />
      <input
        type="password"
        name="password"
        autoComplete="current-password"
        placeholder="Password"
        required
        className={AUTH_INPUT_CLASS}
      />
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      <button type="submit" disabled={isPending} className={AUTH_SUBMIT_CLASS}>
        {isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
