import { EXERCISE_CATALOG } from "@/lib/program/exercise-catalog";

const EXERCISE_NAME_BY_ID = new Map(EXERCISE_CATALOG.map((exercise) => [exercise.id, exercise.name]));

/**
 * "Or" choice cards (PRODUCT_SPEC §6): presented only when the program
 * itself defines alternativeExerciseIds for this slot. Options come solely
 * from seed data — never invented here.
 */
export default function ExerciseChoiceCard({
  primaryExerciseId,
  alternativeExerciseIds,
  onChoose,
}: {
  primaryExerciseId: string;
  alternativeExerciseIds: string[];
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
              {EXERCISE_NAME_BY_ID.get(exerciseId) ?? exerciseId}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
