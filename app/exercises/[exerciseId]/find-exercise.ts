import { findExerciseById } from "@/lib/program/exercise-catalog";
import type { Exercise } from "@/lib/program/program-types";

export interface FoundExercise {
  exercise: Exercise;
  /** True when this exercise came from the active program's own exercises
   * map rather than the static catalog (lib/program/exercise-catalog.ts). */
  fromProgram: boolean;
}

/**
 * Resolves an exerciseId to its full data. Checks the catalog first (static,
 * always available, and what generateStaticParams below prerenders), then
 * the active program's own exercises map (covers ids the catalog has never
 * heard of, e.g. a name unique to the athlete's pasted program, or a
 * catalog-matched exercise whose id was slugified from program-typed text
 * rather than the catalog's own id spelling). Returns null when neither
 * source knows the id, so the caller can render a clean not-found state.
 */
export function findExercise(
  exerciseId: string,
  programExercises: Record<string, Exercise> | null
): FoundExercise | null {
  const catalogMatch = findExerciseById(exerciseId);
  if (catalogMatch) {
    return { exercise: catalogMatch, fromProgram: false };
  }

  const programMatch = programExercises?.[exerciseId];
  if (programMatch) {
    return { exercise: programMatch, fromProgram: true };
  }

  return null;
}
