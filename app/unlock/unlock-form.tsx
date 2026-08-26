"use client";

import { useActionState } from "react";
import { unlockAction, type UnlockState } from "./actions";

const initialState: UnlockState = {};

export default function UnlockForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction, isPending] = useActionState(unlockAction, initialState);

  return (
    <form action={formAction} className="flex w-full max-w-xs flex-col gap-3">
      <input type="hidden" name="redirect" value={redirectTo} />
      <input
        type="password"
        name="passphrase"
        autoFocus
        autoComplete="current-password"
        placeholder="Passphrase"
        className="h-14 rounded-xl border border-line-default bg-surface-1 px-4 text-base text-ink-primary shadow-well transition-colors placeholder:text-ink-tertiary focus:border-accent focus:outline-none"
      />
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      <button
        type="submit"
        disabled={isPending}
        className="h-14 rounded-xl bg-accent text-base font-semibold text-accent-ink transition-colors active:bg-accent-strong disabled:opacity-50"
      >
        {isPending ? "Checking..." : "Unlock"}
      </button>
    </form>
  );
}
