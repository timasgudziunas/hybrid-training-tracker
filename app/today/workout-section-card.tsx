import type { WorkoutSection } from "@/lib/program/program-types";
import { capitalizeLabel } from "./capitalize-label";
import PrescribedExerciseRow from "./prescribed-exercise-row";

export default function WorkoutSectionCard({ section }: { section: WorkoutSection }) {
  const orderedExercises = [...section.exercises].sort((a, b) => a.order - b.order);

  return (
    <section className="flex flex-col gap-2 border-t border-zinc-800 pt-4">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-600">
          {capitalizeLabel(section.type)}
        </span>
        {section.optional ? (
          <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-500">
            Optional
          </span>
        ) : null}
      </div>

      <h2 className="text-sm font-semibold text-white">{section.name}</h2>

      {section.notes?.length ? (
        <ul className="flex flex-col gap-1 text-xs text-zinc-500">
          {section.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}

      <ul className="flex flex-col divide-y divide-zinc-900">
        {orderedExercises.map((exercise) => (
          <PrescribedExerciseRow
            key={`${exercise.order}-${exercise.exerciseId}`}
            exercise={exercise}
            sectionName={section.name}
          />
        ))}
      </ul>
    </section>
  );
}
