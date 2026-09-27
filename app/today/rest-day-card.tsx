import Link from "next/link";
import type { RestDayTemplate } from "@/lib/program/program-types";
import type { MakeUpCandidate } from "@/lib/workout-session/make-up-candidates";
import { capitalizeLabel } from "./capitalize-label";

/**
 * Sunday always renders REST DAY (CLAUDE.md non-negotiables 11, 20) — never
 * a manufactured workout. RestDayTemplate has no sections field at all, so
 * there is structurally nothing to render but its name + description.
 *
 * `makeUps` are training days missed within the last MAKE_UP_WINDOW_DAYS
 * (today-workout-client.tsx computes them), most recent first. Owner
 * decision 2026-09-27: Sunday still renders as a plain rest day here, but a
 * missed session may still be made up on it, so this offer is never
 * suppressed for Sunday the way it once was. Each one taps straight through
 * to /workout/active?makeUpFor=<date>. */
export default function RestDayCard({
  template,
  makeUps = [],
}: {
  template: RestDayTemplate;
  makeUps?: MakeUpCandidate[];
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line-hairline bg-surface-1 p-6 shadow-card sm:p-8">
      <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-ink-tertiary">Rest day</p>
      <h1 className="font-display text-3xl font-bold text-ink-primary sm:text-4xl">{template.name}</h1>
      <p className="text-sm text-ink-secondary">{template.description}</p>
      {makeUps.map((candidate) => (
        <Link
          key={candidate.date}
          href={`/workout/active?makeUpFor=${candidate.date}`}
          className="mt-3 flex h-14 w-full items-center justify-center rounded-xl border border-line-default text-base font-semibold text-ink-primary transition-colors active:bg-surface-2"
        >
          Make up {capitalizeLabel(candidate.weekday)}: {candidate.template.name}
        </Link>
      ))}
    </div>
  );
}
