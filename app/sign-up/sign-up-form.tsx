"use client";

import { useActionState, useEffect } from "react";
import { signUpAction, type AuthFormState } from "@/app/auth/actions";
import { AUTH_INPUT_CLASS, AUTH_SUBMIT_CLASS } from "@/app/auth/auth-field-styles";
import { clearLocalAthleteData } from "@/app/auth/clear-local-athlete-data";

const initialState: AuthFormState = {};

export default function SignUpForm({ redirectTo, inviteRequired }: { redirectTo: string; inviteRequired: boolean }) {
  const [state, formAction, isPending] = useActionState(signUpAction, initialState);

  useEffect(() => {
    clearLocalAthleteData();
  }, []);

  if (state.notice) {
    return <p className="max-w-xs text-center text-sm text-ink-secondary">{state.notice}</p>;
  }

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
        autoComplete="new-password"
        placeholder="Password (8+ characters)"
        required
        minLength={8}
        className={AUTH_INPUT_CLASS}
      />
      {inviteRequired ? (
        <input
          type="password"
          name="invite"
          autoComplete="off"
          placeholder="Invite passphrase"
          required
          className={AUTH_INPUT_CLASS}
        />
      ) : null}
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      <button type="submit" disabled={isPending} className={AUTH_SUBMIT_CLASS}>
        {isPending ? "Creating..." : "Create account"}
      </button>
    </form>
  );
}
