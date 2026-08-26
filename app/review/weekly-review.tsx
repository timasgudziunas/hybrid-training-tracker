import type { ActiveProgramWeek } from "@/lib/history/day-classification";
import type { WorkoutSessionRecord } from "@/lib/workout-session/workout-session-types";
import type { ReadinessEntry } from "@/app/readiness/actions";
import type { BodyweightPoint } from "@/app/progress/actions";
import { addDays, weekdayOfDateString } from "@/lib/history/calendar-grid";
import { computeAdherence } from "@/lib/history/adherence";
import { countSectionTypeExposures, countUltimatePracticeDays, dateRange } from "./training-window-metrics";
import { summarizeWeeklyProgression } from "./exercise-progression";
import { average, bodyweightChange, groinTrendDirection } from "./recovery-metrics";
import ReviewStatTile from "./review-stat-tile";

const WEEK_WINDOW_DAYS = 7;
const GROIN_TREND_LABEL: Record<string, string> = { rising: "Rising", falling: "Falling", stable: "Stable" };

/** Weekly review (PRODUCT_SPEC §16). All numbers over a trailing 7-day
 * window ending today (device-local). Sparse data renders as quiet,
 * explicit "not enough data yet" text rather than a misleading number. */
export default function WeeklyReview({
  today,
  program,
  sessions,
  sessionByDate,
  readinessEntries,
  bodyweightSeries,
}: {
  today: string;
  program: ActiveProgramWeek | null;
  sessions: WorkoutSessionRecord[];
  sessionByDate: Map<string, WorkoutSessionRecord>;
  readinessEntries: ReadinessEntry[];
  bodyweightSeries: BodyweightPoint[];
}) {
  const weekStart = addDays(today, -(WEEK_WINDOW_DAYS - 1));
  const sessionsInWeek = sessions.filter((s) => s.sessionDate >= weekStart && s.sessionDate <= today);
  const readinessInWeek = readinessEntries.filter((e) => e.date >= weekStart && e.date <= today);
  const bodyweightInWeek = bodyweightSeries.filter((p) => p.date >= weekStart && p.date <= today);

  const sessionRefByDate = new Map(
    Array.from(sessionByDate.entries()).map(([date, s]) => [date, { id: s.id, status: s.status }])
  );

  const adherence = computeAdherence({
    today,
    windowDays: WEEK_WINDOW_DAYS,
    program,
    sessionByDate: sessionRefByDate,
    getWeekday: weekdayOfDateString,
  });

  const ultimateDays = countUltimatePracticeDays({
    dates: dateRange(weekStart, today),
    sessionByDate,
    program,
    getWeekday: weekdayOfDateString,
  });

  const progression = summarizeWeeklyProgression(sessionsInWeek);
  const evaluatedCount = progression.progressed + progression.maintained + progression.regressed;
  const speedSessions = countSectionTypeExposures(sessionsInWeek, "speed");
  const powerSessions = countSectionTypeExposures(sessionsInWeek, "power");

  const avgSleep = average(readinessInWeek.map((e) => e.sleepHours).filter((v): v is number => v !== null));
  const avgEnergy = average(readinessInWeek.map((e) => e.energy).filter((v): v is number => v !== null));
  const groinTrend = groinTrendDirection(readinessInWeek.map((e) => ({ date: e.date, groinStatus: e.groinStatus })));
  const weightChange = bodyweightChange(bodyweightInWeek);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs text-ink-tertiary">
        Window: {weekStart} to {today} (7 days).
      </p>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">Training</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ReviewStatTile
            label="Sessions completed"
            value={adherence.percent !== null ? `${adherence.metDays}/${adherence.scheduledDays}` : "—"}
            sub={adherence.percent !== null ? `${adherence.percent}% adherence` : "No scheduled days yet"}
          />
          <ReviewStatTile label="Ultimate practices" value={String(ultimateDays)} sub="days this week" />
          <ReviewStatTile label="Speed sessions" value={String(speedSessions)} sub="this week" />
          <ReviewStatTile label="Power sessions" value={String(powerSessions)} sub="this week" />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">Progression</h2>
        {evaluatedCount > 0 ? (
          <>
            <div className="grid grid-cols-3 gap-3">
              <ReviewStatTile label="Progressed" value={String(progression.progressed)} tone="success" />
              <ReviewStatTile label="Maintained" value={String(progression.maintained)} />
              <ReviewStatTile
                label="Regressed"
                value={String(progression.regressed)}
                tone={progression.regressed > 0 ? "warning" : undefined}
              />
            </div>
            <p className="text-xs text-ink-tertiary">
              Based on {evaluatedCount} exercise{evaluatedCount === 1 ? "" : "s"} logged at least twice this week,
              comparing the two most recent exposures (heaviest working weight, then reps at that weight).
            </p>
          </>
        ) : (
          <p className="text-sm text-ink-tertiary">Not enough data yet: no exercise was logged twice this week.</p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">Recovery</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <ReviewStatTile
            label="Avg sleep"
            value={avgSleep !== null ? `${avgSleep.toFixed(1)}h` : "—"}
            sub={avgSleep === null ? "No entries yet" : undefined}
          />
          <ReviewStatTile
            label="Avg energy"
            value={avgEnergy !== null ? `${avgEnergy.toFixed(1)}/5` : "—"}
            sub={avgEnergy === null ? "No entries yet" : undefined}
          />
          <ReviewStatTile
            label="Groin trend"
            value={groinTrend ? GROIN_TREND_LABEL[groinTrend] : "—"}
            sub={groinTrend === null ? "Not enough entries yet" : "Not a diagnosis"}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">Bodyweight</h2>
        {weightChange ? (
          <ReviewStatTile
            label="Change this week"
            value={`${weightChange.deltaLbs > 0 ? "+" : ""}${weightChange.deltaLbs} lb`}
            sub={`${weightChange.startWeight} lb to ${weightChange.endWeight} lb`}
          />
        ) : (
          <p className="text-sm text-ink-tertiary">Not enough check-ins yet this week to show a change.</p>
        )}
      </section>
    </div>
  );
}
