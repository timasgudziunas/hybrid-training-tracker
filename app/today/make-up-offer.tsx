import Link from "next/link";
import type { MakeUpCandidate } from "@/lib/workout-session/make-up-candidates";
import { capitalizeLabel } from "./capitalize-label";

/**
 * Compact offer shown on a training day when a recent day was missed (owner
 * decision 2026-09-27, make-up sessions): the athlete can start the missed
 * day now, in place of today's own session, rather than only on a later
 * rest day. Rendered between WorkoutCard and UltimatePracticeCheckbox on
 * today-workout-client.tsx. Renders nothing when there is nothing to make
 * up, so callers can render it unconditionally.
 */
export default function MakeUpOffer({ candidates }: { candidates: MakeUpCandidate[] }) {
  if (candidates.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line-hairline bg-surface-1 p-4">
      <div className="flex flex-col gap-0.5">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-ink-tertiary">Missed</p>
        <p className="text-xs text-ink-tertiary">Starts in place of today&apos;s session.</p>
      </div>
      <ul className="flex flex-col divide-y divide-line-hairline">
        {candidates.map((candidate) => (
          <li key={candidate.date} className="flex items-center justify-between gap-3 py-1">
            <span className="text-sm text-ink-secondary">
              {capitalizeLabel(candidate.weekday)}: {candidate.template.name}
            </span>
            <Link
              href={`/workout/active?makeUpFor=${candidate.date}`}
              className="flex h-11 items-center px-1 text-sm font-medium text-accent-strong underline underline-offset-4"
            >
              Make it up instead
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
