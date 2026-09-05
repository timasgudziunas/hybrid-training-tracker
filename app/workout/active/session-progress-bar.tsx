import type { Exercise } from "@/lib/program/program-types";
import type { TemplateSlot } from "@/lib/workout-session/flatten-template-slots";
import type { ExerciseSlotLog } from "@/lib/workout-session/workout-session-types";
import { resolveExerciseChoiceName } from "@/app/today/resolve-exercise-name";

/**
 * Session overview header (owner request 2026-09-04: "at the top of session
 * overview, it should read something appealing... to show progress"): a
 * big completed-over-total count plus one segment per slot in template
 * order, so the athlete sees shape and progress at a glance before the
 * list below. Restrained athletic look per PRODUCT_SPEC (no badges, no
 * emojis, adherence-percent style rather than a game meter).
 *
 * A skipped slot counts as not complete (its segment is drawn distinctly,
 * not folded into "upcoming"), matching how the rest of the overview
 * already treats skip as a real, visible state rather than done.
 */
export default function SessionProgressBar({
  templateSlots,
  slotLogs,
  currentSlotKey,
  exercises,
}: {
  templateSlots: TemplateSlot[];
  slotLogs: Record<string, ExerciseSlotLog>;
  currentSlotKey: string | null;
  exercises: Record<string, Exercise>;
}) {
  const total = templateSlots.length;
  const completed = templateSlots.filter((slot) => slotLogs[slot.slotKey]?.status === "completed").length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line-hairline bg-surface-1 p-5 shadow-card sm:p-6">
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <p className="font-display text-4xl font-bold tabular-nums leading-none text-ink-primary sm:text-5xl">
            {completed} <span className="text-ink-tertiary">/ {total}</span>
          </p>
          <p className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">Exercises complete</p>
        </div>
        <p className="font-display text-lg font-semibold tabular-nums text-ink-tertiary">{percent}%</p>
      </div>

      <div className="flex gap-1">
        {templateSlots.map((slot) => {
          const log = slotLogs[slot.slotKey];
          const status = log?.status ?? "upcoming";
          const isCurrent = slot.slotKey === currentSlotKey;
          const name = resolveExerciseChoiceName(exercises, slot.exercise.exerciseId, slot.exercise.alternativeExerciseIds);

          const fillClass =
            status === "completed" ? "bg-accent" : status === "skipped" ? "bg-warning/40" : "bg-surface-3";

          return (
            <span
              key={slot.slotKey}
              title={name}
              className={`h-2 flex-1 rounded-full ${fillClass} ${
                isCurrent ? "outline outline-2 outline-offset-1 outline-accent-strong" : ""
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
