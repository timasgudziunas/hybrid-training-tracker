import Link from "next/link";

/**
 * Shown on the Today screen when no program has been pasted and activated
 * yet (2026-08-25 rework, non-negotiable 16). Never manufactures a workout
 * from the sample here — the sample is something the athlete chooses to
 * run, from /workout/active?source=sample, not something Today assumes.
 */
export default function WaitingForProgram() {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-line-hairline bg-surface-1 p-6 shadow-card">
      <div className="flex flex-col gap-1.5">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-ink-tertiary">
          No program loaded
        </p>
        <p className="text-sm text-ink-secondary">Paste your training program to see today&apos;s session here.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/program"
          className="flex h-12 flex-1 items-center justify-center rounded-xl bg-accent text-sm font-semibold text-accent-ink transition-colors active:bg-accent-strong"
        >
          Paste your program
        </Link>
        <Link
          href="/workout/active?source=sample"
          className="flex h-12 flex-1 items-center justify-center rounded-xl border border-line-default text-sm font-medium text-ink-secondary transition-colors active:bg-surface-2"
        >
          Try the sample workout
        </Link>
      </div>
    </div>
  );
}
