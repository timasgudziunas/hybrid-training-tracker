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
        className="rounded-md border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 focus:border-zinc-400 focus:outline-none"
      />
      {state.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-white px-4 py-3 font-medium text-black disabled:opacity-50"
      >
        {isPending ? "Checking..." : "Unlock"}
      </button>
    </form>
  );
}
