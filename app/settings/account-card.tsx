"use client";

import { useTransition } from "react";
import { signOutAction } from "@/app/auth/actions";
import { clearLocalAthleteData } from "@/app/auth/clear-local-athlete-data";

/** Who is signed in, and the one way out. Local workout mirrors are cleared
 * before the server session ends so nothing of this athlete's lingers for
 * the next sign-in on a shared device. */
export default function AccountCard({ email }: { email: string | null }) {
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    clearLocalAthleteData();
    startTransition(async () => {
      await signOutAction();
    });
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-line-hairline bg-surface-1 px-5 py-4 shadow-card">
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-medium text-ink-primary">Signed in</span>
        <span className="truncate text-xs text-ink-tertiary">{email ?? "Unknown account"}</span>
      </span>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isPending}
        className="h-10 shrink-0 rounded-xl border border-line-default px-4 text-sm font-medium text-ink-secondary transition-colors hover:text-ink-primary disabled:opacity-50"
      >
        {isPending ? "Signing out..." : "Sign out"}
      </button>
    </div>
  );
}
