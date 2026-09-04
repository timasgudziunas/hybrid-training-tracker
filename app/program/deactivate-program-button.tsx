"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deactivateActiveProgram } from "./actions";

/** Secondary control on the Active program card (owner request 2026-09-04:
 * "I won't be following the same training program anymore... please remove
 * it from my setup"). Deactivates, never deletes: the program stays in the
 * history list below so switching back later is one tap. */
export default function DeactivateProgramButton({ activeName }: { activeName: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDeactivate() {
    setError(null);
    startTransition(async () => {
      const result = await deactivateActiveProgram();
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.reason);
      }
    });
  }

  return (
    <div className="flex flex-col gap-1.5 pt-1">
      <button
        type="button"
        onClick={handleDeactivate}
        disabled={isPending}
        aria-label={`Stop using ${activeName}`}
        className="self-start rounded-lg border border-line-default px-3 py-2 text-xs font-medium text-ink-secondary transition-colors active:bg-surface-2 disabled:opacity-50"
      >
        {isPending ? "Stopping..." : "Stop using this program"}
      </button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <p className="text-xs text-ink-tertiary">
        It stays in the list below so you can switch back at any time.
      </p>
    </div>
  );
}
