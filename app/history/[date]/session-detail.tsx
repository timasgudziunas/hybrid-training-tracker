import { computeCompletionStats } from "@/lib/workout-session/completion-stats";
import { flattenTemplateSlots } from "@/lib/workout-session/flatten-template-slots";
import { detectSessionDeviations } from "@/lib/workout-session/session-deviations";
import type { WorkoutSessionRecord, WorkoutSessionStatus } from "@/lib/workout-session/workout-session-types";
import { formatDateLabel } from "./format-date-label";
import SessionExerciseList from "./session-exercise-list";

const STATUS_LABEL: Record<WorkoutSessionStatus, string> = {
  completed: "Completed",
  modified: "Modified",
  missed: "Missed",
  active: "Left unfinished",
  planned: "Left unfinished",
};

function formatDuration(totalSeconds: number | null): string | null {
  if (totalSeconds === null) return null;
  const minutes = Math.round(totalSeconds / 60);
  return `${minutes} min`;
}

/**
 * The full historical record for one day, rendered entirely from the
 * session row's own templateSnapshot + performance — never re-resolved
 * against the current active program (CLAUDE.md: a re-paste must never
 * corrupt a historical record). An active/planned status here means the
 * session was started and never finished; this is display only, no
 * modification flow is offered (PLAN.md R4 scope).
 */
export default function SessionDetail({ record }: { record: WorkoutSessionRecord }) {
  const { performance } = record;
  const templateSlots = flattenTemplateSlots(performance.templateSnapshot);
  const stats = performance.stats ?? computeCompletionStats(performance, templateSlots);
  const duration = formatDuration(record.durationSeconds);
  const isUnfinished = record.status === "active" || record.status === "planned";
  // Never stored: recomputed live from the session's own templateSnapshot +
  // performance every time this record is viewed (session-deviations.ts),
  // exactly like the completion screen the athlete saw before Finish.
  const deviations = record.status === "modified" ? detectSessionDeviations(performance, templateSlots) : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-line-hairline bg-surface-1 p-6 shadow-card sm:p-8">
        <div className="flex flex-col gap-1.5">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-ink-tertiary">
            {formatDateLabel(record.sessionDate)}
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight text-ink-primary sm:text-4xl">
            {performance.templateSnapshot.name}
          </h1>
          <span className="w-fit rounded-full border border-line-default px-2.5 py-0.5 text-xs font-medium text-ink-secondary">
            {STATUS_LABEL[record.status]}
          </span>
        </div>

        {isUnfinished ? (
          <p className="text-sm text-ink-secondary">
            This session was started but never finished. What was logged before it was left off is shown below.
          </p>
        ) : null}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {duration ? (
            <div className="rounded-xl border border-line-hairline bg-surface-2 p-4">
              <p className="text-xs text-ink-tertiary">Duration</p>
              <p className="font-display text-2xl font-bold tabular-nums text-ink-primary">{duration}</p>
            </div>
          ) : null}
          <div className="rounded-xl border border-line-hairline bg-surface-2 p-4">
            <p className="text-xs text-ink-tertiary">Exercises</p>
            <p className="font-display text-2xl font-bold tabular-nums text-ink-primary">{stats.exercisesCompleted}</p>
          </div>
          <div className="rounded-xl border border-line-hairline bg-surface-2 p-4">
            <p className="text-xs text-ink-tertiary">Sets</p>
            <p className="font-display text-2xl font-bold tabular-nums text-ink-primary">{stats.setsCompleted}</p>
          </div>
          {record.sessionDifficulty !== null ? (
            <div className="rounded-xl border border-line-hairline bg-surface-2 p-4">
              <p className="text-xs text-ink-tertiary">Difficulty</p>
              <p className="font-display text-2xl font-bold tabular-nums text-ink-primary">
                {record.sessionDifficulty} / 5
              </p>
            </div>
          ) : null}
        </div>

        {record.notes ? (
          <div className="flex flex-col gap-1 border-t border-line-hairline pt-4">
            <p className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">Note</p>
            <p className="text-sm text-ink-secondary">{record.notes}</p>
          </div>
        ) : null}
      </div>

      {deviations.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-line-hairline bg-surface-1 p-6 shadow-card sm:p-8">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-ink-tertiary">
            Modifications
          </p>
          <ul className="flex flex-col gap-1 text-sm text-ink-secondary">
            {deviations.map((deviation, index) => (
              <li key={`${deviation.kind}-${deviation.slotKey ?? index}`}>{deviation.label}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-2xl border border-line-hairline bg-surface-1 p-5 shadow-card sm:p-6">
        <SessionExerciseList performance={performance} />
      </div>
    </div>
  );
}
