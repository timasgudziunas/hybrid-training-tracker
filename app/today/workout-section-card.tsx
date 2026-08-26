import type { Exercise, WorkoutSection } from "@/lib/program/program-types";
import { capitalizeLabel } from "./capitalize-label";
import PrescribedExerciseRow from "./prescribed-exercise-row";

export default function WorkoutSectionCard({
  section,
  exercises,
}: {
  section: WorkoutSection;
  exercises: Record<string, Exercise>;
}) {
  const orderedExercises = [...section.exercises].sort((a, b) => a.order - b.order);

  return (
    <section className="flex flex-col gap-2 border-t border-line-hairline pt-5 first:border-t-0 first:pt-0">
      <div className="flex items-center gap-2">
        <span className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-ink-tertiary">
          {capitalizeLabel(section.type)}
        </span>
        {section.optional ? (
          <span className="rounded-full border border-line-default px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-secondary">
            Optional
          </span>
        ) : null}
      </div>

      <h2 className="text-sm font-semibold text-ink-primary">{section.name}</h2>

      {section.notes?.length ? (
        <ul className="flex flex-col gap-1 text-xs text-ink-tertiary">
          {section.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}

      <ul className="flex flex-col divide-y divide-line-hairline">
        {orderedExercises.map((exercise) => (
          <PrescribedExerciseRow
            key={`${exercise.order}-${exercise.exerciseId}`}
            exercise={exercise}
            sectionName={section.name}
            exercises={exercises}
          />
        ))}
      </ul>
    </section>
  );
}
