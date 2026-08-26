"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ProgramRecord } from "./actions";
import { activateProgram } from "./actions";

/** Every program ever saved, newest first, with a one-tap rollback to any
 * earlier one — nothing is ever deleted when a new program is activated. */
export default function ProgramHistoryList({
  programs,
  activeId,
}: {
  programs: ProgramRecord[];
  activeId: string | null;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (programs.length === 0) {
    return null;
  }

  function handleActivate(id: string) {
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      const result = await activateProgram(id);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.reason);
      }
      setPendingId(null);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">
        Program history
      </p>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <ul className="flex flex-col divide-y divide-line-hairline rounded-2xl border border-line-hairline bg-surface-1 px-5">
        {programs.map((program) => {
          const isActive = program.id === activeId;
          return (
            <li key={program.id} className="flex items-center justify-between gap-3 py-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-ink-primary">{program.name}</span>
                <span className="text-xs text-ink-tertiary">{new Date(program.createdAt).toLocaleString()}</span>
              </div>
              {isActive ? (
                <span className="rounded-full bg-success-soft px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-success">
                  Active
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleActivate(program.id)}
                  disabled={isPending && pendingId === program.id}
                  className="rounded-lg border border-line-default px-3 py-2 text-xs font-medium text-ink-secondary transition-colors active:bg-surface-2 disabled:opacity-50"
                >
                  {isPending && pendingId === program.id ? "Activating..." : "Re-activate"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
