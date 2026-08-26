import Link from "next/link";

/**
 * Shown on the Today screen when no program has been pasted and activated
 * yet (2026-08-25 rework, non-negotiable 16). Never manufactures a workout
 * from the sample here — the sample is something the athlete chooses to
 * run, from /workout/active?source=sample, not something Today assumes.
 */
export default function WaitingForProgram() {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-zinc-800 p-5">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">No program loaded</p>
        <p className="text-sm text-zinc-400">
          Paste your training program to see today&apos;s session here.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/program"
          className="flex h-12 flex-1 items-center justify-center rounded-md bg-white text-sm font-semibold text-black active:bg-zinc-300"
        >
          Paste your program
        </Link>
        <Link
          href="/workout/active?source=sample"
          className="flex h-12 flex-1 items-center justify-center rounded-md border border-zinc-700 text-sm font-medium text-zinc-300 active:bg-zinc-900"
        >
          Try the sample workout
        </Link>
      </div>
    </div>
  );
}
