import { EXERCISE_CATALOG } from "@/lib/program/exercise-catalog";

const EXERCISE_NAME_BY_ID = new Map(
  EXERCISE_CATALOG.map((exercise) => [exercise.id, exercise.name])
);

function resolveExerciseName(exerciseId: string): string {
  return EXERCISE_NAME_BY_ID.get(exerciseId) ?? exerciseId;
}

/** Renders a prescribed exercise's primary + alternative ids as the
 * program's "or" choice style, e.g. "Face Pull or Reverse Cable Fly". */
export function resolveExerciseChoiceName(
  exerciseId: string,
  alternativeExerciseIds?: string[]
): string {
  return [exerciseId, ...(alternativeExerciseIds ?? [])]
    .map(resolveExerciseName)
    .join(" or ");
}
