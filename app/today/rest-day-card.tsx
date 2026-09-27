import Link from "next/link";
import type { RestDayTemplate, TrainingDayTemplate } from "@/lib/program/program-types";

/** Sunday always renders REST DAY (CLAUDE.md non-negotiables 11, 20) — never
 * a manufactured workout. RestDayTemplate has no sections field at all, so
 * there is structurally nothing to render but its name + description.
 *
 * `makeUp` is yesterday's training day when today is a non-Sunday rest day
 * (today-workout-client.tsx decides): one tap starts it through
 * /workout/active?day=, so a missed session can be made up without typing a
 * URL. Never offered on Sunday. */
export default function RestDayCard({
  template,
  makeUp = null,
}: {
  template: RestDayTemplate;
  makeUp?: TrainingDayTemplate | null;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line-hairline bg-surface-1 p-6 shadow-card sm:p-8">
      <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-ink-tertiary">Rest day</p>
      <h1 className="font-display text-3xl font-bold text-ink-primary sm:text-4xl">{template.name}</h1>
      <p className="text-sm text-ink-secondary">{template.description}</p>
      {makeUp ? (
        <Link
          href={`/workout/active?day=${makeUp.weekday}`}
          className="mt-3 flex h-14 w-full items-center justify-center rounded-xl border border-line-default text-base font-semibold text-ink-primary transition-colors active:bg-surface-2"
        >
          Make up yesterday: {makeUp.name}
        </Link>
      ) : null}
    </div>
  );
}
