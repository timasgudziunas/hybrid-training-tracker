import type { ActiveProgramWeek } from "@/lib/history/day-classification";
import type { WorkoutSessionRecord } from "@/lib/workout-session/workout-session-types";
import type { ReadinessEntry } from "@/app/readiness/actions";
import type { BenchmarkEntry, BodyweightPoint } from "@/app/progress/actions";
import { BENCHMARK_DEFINITIONS } from "@/lib/benchmarks/benchmark-definitions";
import { addDays, weekdayOfDateString } from "@/lib/history/calendar-grid";
import { computeAdherence } from "@/lib/history/adherence";
import { topStrengthHighlights } from "./exercise-progression";
import { average, bodyweightChange, groinTrendDirection } from "./recovery-metrics";
import ReviewStatTile from "./review-stat-tile";

const MONTH_WINDOW_DAYS = 28;
const GROIN_TREND_LABEL: Record<string, string> = { rising: "Rising", falling: "Falling", stable: "Stable" };

/** Monthly review (PRODUCT_SPEC §17). All numbers over a trailing 28-day
 * window ending today (device-local). Emphasizes trends over single-point
 * numbers; a caveat sits next to the strength highlights so a second trend
 * shown nearby is never implied as its cause. */
export default function MonthlyReview({
  today,
  program,
  sessions,
  sessionByDate,
  readinessEntries,
  bodyweightSeries,
  benchmarkEntries,
}: {
  today: string;
  program: ActiveProgramWeek | null;
  sessions: WorkoutSessionRecord[];
  sessionByDate: Map<string, WorkoutSessionRecord>;
  readinessEntries: ReadinessEntry[];
  bodyweightSeries: BodyweightPoint[];
  benchmarkEntries: Record<string, BenchmarkEntry[]>;
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

  const allBenchmarksInWindow = Object.values(benchmarkEntries)
    .flat()
    .filter((entry) => entry.measuredOn >= monthStart && entry.measuredOn <= today)
    .sort((a, b) => b.measuredOn.localeCompare(a.measuredOn));

  const lSitEntriesInWindow = (benchmarkEntries.l_sit_hold ?? []).filter(
    (e) => e.measuredOn >= monthStart && e.measuredOn <= today
  );
  const bestLSit = lSitEntriesInWindow.length > 0 ? Math.max(...lSitEntriesInWindow.map((e) => e.value)) : null;

  const plancheDefinition = BENCHMARK_DEFINITIONS.find((d) => d.type === "planche_level");
  const plancheLevels = plancheDefinition?.input.kind === "ordinal-level" ? plancheDefinition.input.levels : [];
  const plancheEntriesInWindow = (benchmarkEntries.planche_level ?? [])
    .filter((e) => e.measuredOn >= monthStart && e.measuredOn <= today)
    .sort((a, b) => a.measuredOn.localeCompare(b.measuredOn));
  const plancheFirst = plancheEntriesInWindow[0] ?? null;
  const plancheLast = plancheEntriesInWindow[plancheEntriesInWindow.length - 1] ?? null;
  const plancheChanged = Boolean(plancheFirst && plancheLast && plancheFirst.value !== plancheLast.value);

  const readinessInWindow = readinessEntries.filter((e) => e.date >= monthStart && e.date <= today);
  const avgSleep = average(readinessInWindow.map((e) => e.sleepHours).filter((v): v is number => v !== null));
  const avgEnergy = average(readinessInWindow.map((e) => e.energy).filter((v): v is number => v !== null));
  const avgSoreness = average(readinessInWindow.map((e) => e.soreness).filter((v): v is number => v !== null));
  const groinTrend = groinTrendDirection(readinessInWindow.map((e) => ({ date: e.date, groinStatus: e.groinStatus })));

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

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">
          Athletic benchmarks logged
        </h2>
        {allBenchmarksInWindow.length > 0 ? (
          <div className="flex flex-col divide-y divide-line-hairline rounded-2xl border border-line-hairline bg-surface-1 px-4">
            {allBenchmarksInWindow.map((entry) => {
              const definition = BENCHMARK_DEFINITIONS.find((d) => d.type === entry.type);
              return (
                <div key={entry.id} className="flex items-center justify-between gap-3 py-3">
                  <span className="text-sm text-ink-primary">{definition?.label ?? entry.type}</span>
                  <span className="font-display text-sm tabular-nums text-ink-secondary">
                    {entry.value} {entry.unit} &middot; {entry.measuredOn}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-ink-tertiary">No benchmark measurements logged in this window.</p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">Calisthenics</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <ReviewStatTile
            label="Best L-sit hold"
            value={bestLSit !== null ? `${bestLSit} s` : "—"}
            sub={bestLSit === null ? "Not enough data yet" : "Best single hold this window"}
          />
          <ReviewStatTile
            label="Planche progression"
            value={
              plancheLast
                ? (plancheLevels.find((l) => l.order === plancheLast.value)?.name ?? `Level ${plancheLast.value}`)
                : "—"
            }
            sub={
              !plancheLast
                ? "Not enough data yet"
                : plancheChanged && plancheFirst
                  ? `Advanced from ${plancheLevels.find((l) => l.order === plancheFirst.value)?.name ?? plancheFirst.value}`
                  : "No change this window"
            }
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">Recovery</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ReviewStatTile label="Avg sleep" value={avgSleep !== null ? `${avgSleep.toFixed(1)}h` : "—"} />
          <ReviewStatTile label="Avg energy" value={avgEnergy !== null ? `${avgEnergy.toFixed(1)}/5` : "—"} />
          <ReviewStatTile label="Avg soreness" value={avgSoreness !== null ? `${avgSoreness.toFixed(1)}/5` : "—"} />
          <ReviewStatTile
            label="Groin trend"
            value={groinTrend ? GROIN_TREND_LABEL[groinTrend] : "—"}
            sub="Not a diagnosis"
          />
        </div>
      </section>
    </div>
  );
}
