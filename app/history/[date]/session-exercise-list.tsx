import type { ReactElement } from "react";
import type { Exercise, WorkoutSection } from "@/lib/program/program-types";
import { flattenTemplateSlots } from "@/lib/workout-session/flatten-template-slots";
import type { ExerciseSlotStatus, WorkoutSessionPerformance } from "@/lib/workout-session/workout-session-types";
import { formatSetLog } from "./format-set-log";

function exerciseName(exercises: Record<string, Exercise>, exerciseId: string | undefined): string {
  if (!exerciseId) return "Not yet chosen";
  return exercises[exerciseId]?.name ?? exerciseId;
}

function StatusBadge({ status }: { status: ExerciseSlotStatus | undefined }) {
  if (status === "completed") {
    return <span className="text-xs font-medium text-success">Done</span>;
  }
  if (status === "skipped") {
    return <span className="text-xs font-medium text-ink-tertiary">Skipped</span>;
  }
  return <span className="text-xs font-medium text-ink-tertiary">Not reached</span>;
}

/**
 * Renders a session's full exercise-by-exercise record from the session
 * row's own `templateSnapshot` + `performance.slots` (never the current
 * active program — a re-paste must never corrupt a historical record).
 * flattenTemplateSlots gives the exact ordered slot keys this session was
 * logged against, so each SetLog maps back to the right prescription type.
 */
export default function SessionExerciseList({ performance }: { performance: WorkoutSessionPerformance }) {
  const { templateSnapshot, exercisesSnapshot, slots } = performance;
  const templateSlots = flattenTemplateSlots(templateSnapshot);

  const sectionOrder: string[] = [];
  const sectionsById = new Map<string, { section: WorkoutSection; rows: ReactElement[] }>();

  for (const templateSlot of templateSlots) {
    const slotLog = slots[templateSlot.slotKey];
    const name = exerciseName(exercisesSnapshot, slotLog?.chosenExerciseId ?? templateSlot.exercise.exerciseId);
    const prescriptionType = templateSlot.exercise.prescription.type;

    const row = (
      <li key={templateSlot.slotKey} className="flex flex-col gap-1.5 py-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium text-ink-primary">{name}</span>
          <StatusBadge status={slotLog?.status} />
        </div>

        {slotLog && slotLog.sets.length > 0 ? (
          <ul className="flex flex-col gap-0.5 font-display text-sm tabular-nums text-ink-secondary">
            {slotLog.sets.map((set) => (
              <li key={set.setNumber}>
                Set {set.setNumber}: {formatSetLog(set, prescriptionType)}
              </li>
            ))}
          </ul>
        ) : slotLog?.qualitativeCompleted ? (
          <p className="text-sm text-ink-secondary">Completed</p>
        ) : null}

        {slotLog?.note ? <p className="text-xs text-ink-tertiary">Note: {slotLog.note}</p> : null}
      </li>
    );

    const existing = sectionsById.get(templateSlot.section.id);
    if (existing) {
      existing.rows.push(row);
    } else {
      sectionsById.set(templateSlot.section.id, { section: templateSlot.section, rows: [row] });
      sectionOrder.push(templateSlot.section.id);
    }
  }

  return (
    <div className="flex flex-col">
      {sectionOrder.map((sectionId) => {
        const entry = sectionsById.get(sectionId);
        if (!entry) return null;
        return (
          <section
            key={sectionId}
            className="flex flex-col gap-2 border-t border-line-hairline pt-5 first:border-t-0 first:pt-0"
          >
            <h2 className="text-sm font-semibold text-ink-primary">{entry.section.name}</h2>
            <ul className="flex flex-col divide-y divide-line-hairline">{entry.rows}</ul>
          </section>
        );
      })}
    </div>
  );
}
