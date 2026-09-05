import type { ActiveProgramWeek } from "@/lib/history/day-classification";
import type { WorkoutSessionRecord } from "@/lib/workout-session/workout-session-types";
import type { BodyweightPoint } from "@/app/body/bodyweight-series-actions";
import { addDays, weekdayOfDateString } from "@/lib/history/calendar-grid";
import { computeAdherence } from "@/lib/history/adherence";
import { topStrengthHighlights } from "./exercise-progression";
import { bodyweightChange } from "./bodyweight-change";
import ReviewStatTile from "./review-stat-tile";

const MONTH_WINDOW_DAYS = 28;

/** Monthly review (PRODUCT_SPEC §17). All numbers over a trailing 28-day
 * window ending today (device-local). Emphasizes trends over single-point
 * numbers; a caveat sits next to the strength highlights so a second trend
 * shown nearby is never implied as its cause. */
export default function MonthlyReview({
  today,
  program,
  sessions,
  sessionByDate,
  bodyweightSeries,
}: {
  today: string;
  program: ActiveProgramWeek | null;
  sessions: WorkoutSessionRecord[];
  sessionByDate: Map<string, WorkoutSessionRecord>;
  bodyweightSeries: BodyweightPoint[];
}) {
  const monthStart = addDays(today, -(MONTH_WINDOW_DAYS - 1));

  const sessionRefByDate = new Map(
    Array.from(sessionByDate.entries()).map(([date, s]) => [date, { id: s.id, status: s.status }])
  );

  const adherence = computeAdherence({
    today,
    windowDays: MONTH_WINDOW_DAYS,
    program,
    sessionByDate: sessionRefByDate,
    getWeekday: weekdayOfDateString,
  });

  const highlights = topStrengthHighlights(sessions, 3);

  const bodyweightInWindow = bodyweightSeries.filter((p) => p.date >= monthStart && p.date <= today);
  const weightChange = bodyweightChange(bodyweightInWindow);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs text-ink-tertiary">
        Window: {monthStart} to {today} (28 days).
      </p>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">Adherence</h2>
        {adherence.percent !== null ? (
          <ReviewStatTile
            label="28-day adherence"
            value={`${adherence.percent}%`}
            sub={`${adherence.metDays} of ${adherence.scheduledDays} scheduled sessions completed`}
          />
        ) : (
          <p className="text-sm text-ink-tertiary">
            {program ? "No scheduled training days in this window yet." : "Paste a program to start tracking adherence."}
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">
          Strength trend highlights
        </h2>
        {highlights.length > 0 ? (
          <div className="flex flex-col divide-y divide-line-hairline rounded-2xl border border-line-hairline bg-surface-1 px-4">
            {highlights.map((highlight) => (
              <div key={highlight.exerciseName} className="flex items-center justify-between gap-3 py-3">
                <span className="text-sm text-ink-primary">{highlight.exerciseName}</span>
                <span className="font-display text-sm tabular-nums text-ink-secondary">
                  {highlight.earlierWeight} lb &rarr; {highlight.laterWeight} lb (
                  {highlight.deltaWeight > 0 ? "+" : ""}
                  {highlight.deltaWeight})
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-tertiary">
            Not enough data yet: no exercise has two logged exposures in the last 28 days.
          </p>
        )}
        <p className="text-xs text-ink-tertiary">
          Top 3 by heaviest-working-weight change between the first and last logged exposure in this window. Shown
          alongside recovery and bodyweight below without implying either caused it.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">Bodyweight</h2>
        {weightChange ? (
          <ReviewStatTile
            label="28-day change"
            value={`${weightChange.deltaLbs > 0 ? "+" : ""}${weightChange.deltaLbs} lb`}
            sub={`${weightChange.startWeight} lb to ${weightChange.endWeight} lb`}
          />
        ) : (
          <p className="text-sm text-ink-tertiary">Not enough check-ins yet in this window to show a trend.</p>
        )}
      </section>
    </div>
  );
}
