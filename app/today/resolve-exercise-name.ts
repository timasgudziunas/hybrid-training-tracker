import type { Exercise } from "@/lib/program/program-types";

/**
 * Resolves an exerciseId to its display name against a specific program's
 * exercises map (2026-08-25 rework: there is no more one static catalog of
 * "the" program's exercises — every ResolvedProgram, pasted or sample,
 * carries its own `exercises` map, built by the parser). Falls back to the
 * raw id only if something is missing (should not happen for a
 * well-formed program).
 */
function resolveExerciseName(exercises: Record<string, Exercise>, exerciseId: string): string {
  return exercises[exerciseId]?.name ?? exerciseId;
}

/** Renders a prescribed exercise's primary + alternative ids as the
 * program's "or" choice style, e.g. "Face Pull or Reverse Cable Fly". */
export function resolveExerciseChoiceName(
  exercises: Record<string, Exercise>,
  exerciseId: string,
  alternativeExerciseIds?: string[]
): string {
  return [exerciseId, ...(alternativeExerciseIds ?? [])]
    .map((id) => resolveExerciseName(exercises, id))
    .join(" or ");
}
