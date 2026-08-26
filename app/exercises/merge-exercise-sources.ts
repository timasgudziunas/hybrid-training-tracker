import { EXERCISE_CATALOG } from "@/lib/program/exercise-catalog";
import type { Exercise, ExerciseCategory } from "@/lib/program/program-types";
import { hasFullGuidance } from "./has-full-guidance";

/**
 * One row in the exercise library index: either a catalog exercise (the
 * knowledge base in lib/program/exercise-catalog.ts) or an exercise that
 * exists only because the athlete's active pasted program mentions it by a
 * name the catalog has no entry for. Never both: when a program exercise's
 * name matches a catalog entry, the parser (lib/program/parse-program-text.ts,
 * resolveExerciseId) already copies the catalog's full instructional content
 * onto it, so it is represented once, as the catalog entry.
 */
export interface LibraryExerciseEntry {
  id: string;
  name: string;
  category: ExerciseCategory;
  primaryMuscles: string[];
  hasFullGuidance: boolean;
  fromProgram: boolean;
}

/**
 * Same normalization the parser uses to match a typed program exercise name
 * against the catalog (lib/program/parse-program-text.ts,
 * normalizeForCatalogMatch), duplicated here in miniature since that
 * function isn't exported from lib/program. Keep the two in sync if either
 * changes.
 */
function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Builds the full library index: every catalog exercise, plus any exercise
 * the active program references that the catalog has no match for (labeled
 * "from your program" by the caller). `programExercises` is the active
 * program's own exercises map (app/program/actions.ts fetchActiveProgram),
 * or null when no program is active yet.
 */
export function mergeExerciseSources(
  programExercises: Record<string, Exercise> | null
): LibraryExerciseEntry[] {
  const catalogNames = new Set(EXERCISE_CATALOG.map((exercise) => normalizeName(exercise.name)));

  const catalogEntries: LibraryExerciseEntry[] = EXERCISE_CATALOG.map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    category: exercise.category,
    primaryMuscles: exercise.primaryMuscles,
    hasFullGuidance: hasFullGuidance(exercise),
    fromProgram: false,
  }));

  const seenProgramNames = new Set<string>();
  const programOnlyEntries: LibraryExerciseEntry[] = [];
  for (const exercise of Object.values(programExercises ?? {})) {
    const normalized = normalizeName(exercise.name);
    if (catalogNames.has(normalized) || seenProgramNames.has(normalized)) continue;
    seenProgramNames.add(normalized);
    programOnlyEntries.push({
      id: exercise.id,
      name: exercise.name,
      category: exercise.category,
      primaryMuscles: exercise.primaryMuscles,
      hasFullGuidance: hasFullGuidance(exercise),
      fromProgram: true,
    });
  }

  return [...catalogEntries, ...programOnlyEntries];
}
