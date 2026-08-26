import type { Exercise } from "@/lib/program/program-types";

/**
 * "Or" choice cards (PRODUCT_SPEC §6): presented only when the program
 * itself defines alternativeExerciseIds for this slot. Options come solely
 * from the program — never invented here. `exercises` is the session's
 * exercisesSnapshot (2026-08-25 rework), not a static catalog.
 */
export default function ExerciseChoiceCard({
  primaryExerciseId,
  alternativeExerciseIds,
  exercises,
  onChoose,
}: {
  primaryExerciseId: string;
  alternativeExerciseIds: string[];
  exercises: Record<string, Exercise>;
  onChoose: (exerciseId: string) => void;
}) {
  const options = [primaryExerciseId, ...alternativeExerciseIds];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-secondary">Pick one, whatever you feel today.</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        {options.map((exerciseId) => (
          <button
            key={exerciseId}
            type="button"
            onClick={() => onChoose(exerciseId)}
            className="flex-1 cursor-pointer rounded-2xl border border-line-default bg-surface-1 p-6 text-left shadow-card transition-colors hover:border-accent active:border-accent active:bg-surface-2"
          >
            <span className="font-display text-xl font-bold text-ink-primary">
              {exercises[exerciseId]?.name ?? exerciseId}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
