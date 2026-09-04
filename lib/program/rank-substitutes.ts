/**
 * Pure ranking for the exercise swap picker (2026-09-04, owner request:
 * "recommend exercises that target the same muscles in case I do decide to
 * go with a different one"). Splits the catalog into `similar` (shares
 * muscle group or category with the exercise being swapped out, plus any
 * exercise the current one explicitly lists in `substitutions`) and
 * `others` (everything else, sorted the way the swap list always has been:
 * by the section's relevant categories first, then name).
 */

import type { Exercise, ExerciseCategory, SectionType } from './program-types';

/** Points per shared primary muscle between the two exercises. */
const SHARED_PRIMARY_MUSCLE_WEIGHT = 2;
/** Points when one exercise's primary muscle is the other's secondary
 * muscle (checked both directions). */
const PRIMARY_MATCHES_SECONDARY_MUSCLE_WEIGHT = 1;
/** Points when both exercises share the same catalog category. */
const SAME_CATEGORY_WEIGHT = 1;

/** Rough priority mapping from a workout section's type to the exercise
 * catalog categories most relevant to it, used only to sort the "others"
 * list (never to filter it out entirely — any catalog exercise remains
 * pickable, per the owner's 2026-08-26 decision to go beyond program-defined
 * "or" pairs). Sections without an exact category counterpart (warmup,
 * core, recovery) map to the closest catalog categories. */
export const SECTION_CATEGORY_PRIORITY: Record<SectionType, ExerciseCategory[]> = {
  warmup: ['mobility'],
  speed: ['speed'],
  power: ['power'],
  calisthenics: ['calisthenics'],
  strength: ['strength', 'hypertrophy'],
  core: ['calisthenics', 'hypertrophy'],
  mobility: ['mobility'],
  recovery: ['mobility', 'rehabilitation-prehab'],
  cardio: ['cardio'],
};

/** How closely `candidate` targets the same muscles/category as `current`.
 * 0 means no overlap detected at all. */
export function similarityScore(current: Exercise, candidate: Exercise): number {
  let score = 0;

  for (const muscle of candidate.primaryMuscles) {
    if (current.primaryMuscles.includes(muscle)) {
      score += SHARED_PRIMARY_MUSCLE_WEIGHT;
    } else if (current.secondaryMuscles.includes(muscle)) {
      score += PRIMARY_MATCHES_SECONDARY_MUSCLE_WEIGHT;
    }
  }

  for (const muscle of current.primaryMuscles) {
    if (candidate.secondaryMuscles.includes(muscle)) {
      score += PRIMARY_MATCHES_SECONDARY_MUSCLE_WEIGHT;
    }
  }

  if (current.category === candidate.category) {
    score += SAME_CATEGORY_WEIGHT;
  }

  return score;
}

function sortByCategoryPriorityThenName(exercises: Exercise[], priority: ExerciseCategory[]): Exercise[] {
  return [...exercises].sort((a, b) => {
    const aPriority = priority.includes(a.category) ? 0 : 1;
    const bPriority = priority.includes(b.category) ? 0 : 1;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Splits `candidates` (the swap picker's full search results, already
 * excluding the current exercise) into `similar` and `others`.
 *
 * `similar`: any of `current.substitutions` (by id, in listed order) first,
 * then every candidate with similarityScore > 0 against `current`, sorted
 * by score desc then name. `others`: the rest, sorted the way the swap list
 * has always been ordered (section-relevant categories first, then name).
 *
 * When `current` is undefined (no exercise resolved yet — shouldn't happen
 * in practice, but the picker's prop is optional), everything is `others`.
 */
export function rankSubstitutes(
  current: Exercise | undefined,
  candidates: Exercise[],
  sectionType: SectionType
): { similar: Exercise[]; others: Exercise[] } {
  const priority = SECTION_CATEGORY_PRIORITY[sectionType] ?? [];
  const pool = current ? candidates.filter((exercise) => exercise.id !== current.id) : candidates;

  if (!current) {
    return { similar: [], others: sortByCategoryPriorityThenName(pool, priority) };
  }

  const byId = new Map(pool.map((exercise) => [exercise.id, exercise]));
  const explicitIds = current.substitutions ?? [];
  const explicit = explicitIds
    .map((id) => byId.get(id))
    .filter((exercise): exercise is Exercise => Boolean(exercise));
  const explicitIdSet = new Set(explicit.map((exercise) => exercise.id));

  const scored = pool
    .filter((exercise) => !explicitIdSet.has(exercise.id))
    .map((exercise) => ({ exercise, score: similarityScore(current, exercise) }));

  const bySimilarity = scored
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return a.exercise.name.localeCompare(b.exercise.name);
    })
    .map((entry) => entry.exercise);

  const others = scored.filter((entry) => entry.score === 0).map((entry) => entry.exercise);

  return {
    similar: [...explicit, ...bySimilarity],
    others: sortByCategoryPriorityThenName(others, priority),
  };
}
