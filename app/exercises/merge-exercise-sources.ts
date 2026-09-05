import { EXERCISE_CATALOG } from "@/lib/program/exercise-catalog";
import type { Equipment, Exercise, ExerciseCategory, MuscleGroup, Prescription } from "@/lib/program/program-types";
import { normalizeExerciseNameForMatch } from "@/lib/program/slugify-exercise-name";
import { formatPrescriptionPreset, loggingFieldLabels } from "@/lib/program/set-entry-fields";
import { hasFullGuidance } from "./has-full-guidance";

/**
 * One row in the exercise library index: either a catalog exercise (the
 * knowledge base in lib/program/exercise-catalog.ts) or an exercise that
 * exists only because the athlete's active pasted program mentions it by a
 * name the catalog has no entry for. Never both: when a program exercise's
 * name matches a catalog entry, the parser (lib/program/parse-program-text.ts,
 * resolveExerciseId) already copies the catalog's full instructional content
 * onto it, so it is represented once, as the catalog entry.
 *
 * `muscleGroup`, `equipment`, and `defaultPrescription` are unset for
 * program-only entries the catalog has no match for (Exercise's own
 * optionality rule, program-types.ts). The library groups those under an
 * "Other" bucket when sorting by muscle group (lib/program/exercise-filters.ts).
 */
export interface LibraryExerciseEntry {
  id: string;
  name: string;
  category: ExerciseCategory;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  muscleGroup?: MuscleGroup;
  equipment?: Equipment[];
  defaultPrescription?: Prescription;
  hasFullGuidance: boolean;
  fromProgram: boolean;
  /** One-line preset summary (e.g. "3 sets of 8 to 12 reps"), or null when
   * this exercise has no defaultPrescription (program-only, unmatched). */
  presetSummary: string | null;
  /** What gets logged per set under that preset (e.g. ["Weight (lb)",
   * "Reps", "RIR"]), or [] when there is no preset. */
  loggingLabels: string[];
}

function toLibraryEntry(exercise: Exercise, fromProgram: boolean): LibraryExerciseEntry {
  const defaultPrescription = exercise.defaultPrescription;
  return {
    id: exercise.id,
    name: exercise.name,
    category: exercise.category,
    primaryMuscles: exercise.primaryMuscles,
    secondaryMuscles: exercise.secondaryMuscles,
    muscleGroup: exercise.muscleGroup,
    equipment: exercise.equipment,
    defaultPrescription,
    hasFullGuidance: hasFullGuidance(exercise),
    fromProgram,
    presetSummary: defaultPrescription ? formatPrescriptionPreset(defaultPrescription) : null,
    loggingLabels: defaultPrescription ? loggingFieldLabels(exercise, defaultPrescription) : [],
  };
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
  const catalogNames = new Set(EXERCISE_CATALOG.map((exercise) => normalizeExerciseNameForMatch(exercise.name)));

  const catalogEntries: LibraryExerciseEntry[] = EXERCISE_CATALOG.map((exercise) => toLibraryEntry(exercise, false));

  const seenProgramNames = new Set<string>();
  const programOnlyEntries: LibraryExerciseEntry[] = [];
  for (const exercise of Object.values(programExercises ?? {})) {
    const normalized = normalizeExerciseNameForMatch(exercise.name);
    if (catalogNames.has(normalized) || seenProgramNames.has(normalized)) continue;
    seenProgramNames.add(normalized);
    programOnlyEntries.push(toLibraryEntry(exercise, true));
  }

  return [...catalogEntries, ...programOnlyEntries];
}
