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
      <p className="text-sm text-zinc-400">Pick one, whatever you feel today.</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        {options.map((exerciseId) => (
          <button
            key={exerciseId}
            type="button"
            onClick={() => onChoose(exerciseId)}
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 p-5 text-left transition-colors active:border-white"
          >
            <span className="text-base font-medium text-white">
              {exercises[exerciseId]?.name ?? exerciseId}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
