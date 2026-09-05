/**
 * The exercise catalog (R10, 2026-09-04): the built-in library of every
 * exercise the app knows, assembled from one file per muscle group under
 * lib/program/catalog/. Each entry is a CatalogExercise: filter metadata
 * (muscle group, equipment), a logging preset (defaultPrescription), and
 * complete guidance (where to feel it, cues, common mistakes).
 *
 * Roles of the catalog:
 * - The parser (parse-program-text.ts) matches pasted exercise names
 *   against it by normalized name and copies the entry's metadata and
 *   guidance onto the parsed exercise.
 * - The exercise library (/exercises) lists and filters it.
 * - Swap and "Add exercise" (active workout) pick from it.
 *
 * It is never a source of workout content on its own (CLAUDE.md
 * non-negotiable 16): sessions render from the active program or the sample.
 *
 * Rules every entry follows (asserted by scripts/test-exercise-catalog.ts):
 * - id === slugifyExerciseName(name), so catalog ids and pasted-program
 *   ids always agree.
 * - ids and normalized names are unique across all group files.
 * - No running, jogging, sprinting, or treadmill exercises: the owner
 *   removed everything on foot from the library on 2026-09-04. Speed work
 *   pasted into a program still parses (the `distance` prescription type
 *   is unchanged); it just has no library entry.
 */

import type { CatalogExercise, Exercise } from './program-types';
import { CHEST_EXERCISES } from './catalog/chest';
import { BACK_EXERCISES } from './catalog/back';
import { SHOULDER_EXERCISES } from './catalog/shoulders';
import { ARM_EXERCISES } from './catalog/arms';
import { QUAD_EXERCISES } from './catalog/quads';
import { POSTERIOR_CHAIN_EXERCISES } from './catalog/posterior-chain';
import { CALF_EXERCISES } from './catalog/calves';
import { CORE_EXERCISES } from './catalog/core';
import { CALISTHENICS_EXERCISES } from './catalog/calisthenics';
import { POWER_EXERCISES } from './catalog/power';
import { MOBILITY_PREHAB_EXERCISES } from './catalog/mobility-prehab';
import { CARDIO_EXERCISES } from './catalog/cardio';

export const EXERCISE_CATALOG: CatalogExercise[] = [
  ...CHEST_EXERCISES,
  ...BACK_EXERCISES,
  ...SHOULDER_EXERCISES,
  ...ARM_EXERCISES,
  ...QUAD_EXERCISES,
  ...POSTERIOR_CHAIN_EXERCISES,
  ...CALF_EXERCISES,
  ...CORE_EXERCISES,
  ...CALISTHENICS_EXERCISES,
  ...POWER_EXERCISES,
  ...MOBILITY_PREHAB_EXERCISES,
  ...CARDIO_EXERCISES,
];

const CATALOG_BY_ID = new Map<string, CatalogExercise>();
for (const exercise of EXERCISE_CATALOG) {
  if (CATALOG_BY_ID.has(exercise.id)) {
    // Authored content, not user input: a duplicate id is a bug in a
    // catalog file and should fail the build/dev server loudly.
    throw new Error(`Duplicate exercise id in catalog: ${exercise.id}`);
  }
  CATALOG_BY_ID.set(exercise.id, exercise);
}

export function findExerciseById(exerciseId: string): Exercise | undefined {
  return CATALOG_BY_ID.get(exerciseId);
}
