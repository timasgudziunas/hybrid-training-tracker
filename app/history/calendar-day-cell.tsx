import Link from "next/link";
import type { DayClassification, DayState } from "@/lib/history/day-classification";

/** Restrained tint per state — soft semantic tokens, no alarm colors
 * (PRODUCT_SPEC §20), matching CalendarLegend exactly. */
const STATE_CLASS_NAMES: Record<DayState, string> = {
  completed: "bg-success-soft text-ink-primary",
  modified: "bg-warning-soft text-ink-primary",
  missed: "bg-danger-soft text-ink-primary",
  rest: "bg-surface-2 text-ink-tertiary",
  scheduled: "bg-accent-soft text-ink-primary",
  unscheduled: "text-ink-tertiary",
  future: "text-ink-tertiary",
};

/** One calendar cell. Only links to the day drill-down when a real
 * (non-sample) session exists for the date — a plain "missed"/"rest" day
 * with nothing logged has nothing to drill into. */
export default function CalendarDayCell({
  day,
  inCurrentMonth,
  classification,
}: {
  day: number;
  inCurrentMonth: boolean;
  classification: DayClassification;
}) {
  const { date, state, isToday, ultimatePracticeLater, hasBodyCheckin, session } = classification;

  const body = (
    <div
      className={`relative flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg border ${
        isToday ? "border-accent" : "border-transparent"
      } ${STATE_CLASS_NAMES[state]} ${inCurrentMonth ? "" : "opacity-35"}`}
    >
      <span className="font-display text-sm font-semibold tabular-nums">{day}</span>
      {ultimatePracticeLater || hasBodyCheckin ? (
        <span className="flex items-center gap-0.5">
          {ultimatePracticeLater ? <span className="h-1 w-1 rounded-full bg-accent" aria-hidden="true" /> : null}
          {hasBodyCheckin ? <span className="h-1 w-1 rounded-full bg-ink-tertiary" aria-hidden="true" /> : null}
        </span>
      ) : null}
    </div>
  );

  if (!session) {
    return (
      <div aria-label={date} title={date}>
        {body}
      </div>
    );
  }

  return (
    <Link href={`/history/${date}`} aria-label={`${date}, view session`} className="block">
      {body}
    </Link>
  );
}
