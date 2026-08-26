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
      <p className="text-xs uppercase tracking-widest text-zinc-500">Program history</p>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <ul className="flex flex-col divide-y divide-zinc-900">
        {programs.map((program) => {
          const isActive = program.id === activeId;
          return (
            <li key={program.id} className="flex items-center justify-between gap-3 py-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white">{program.name}</span>
                <span className="text-xs text-zinc-500">{new Date(program.createdAt).toLocaleString()}</span>
              </div>
              {isActive ? (
                <span className="text-xs uppercase tracking-widest text-emerald-400">Active</span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleActivate(program.id)}
                  disabled={isPending && pendingId === program.id}
                  className="rounded-md border border-zinc-700 px-3 py-2 text-xs text-zinc-300 active:bg-zinc-900 disabled:opacity-50"
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
