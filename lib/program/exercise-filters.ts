/**
 * Pure filter and sort logic for the exercise library browser (R10, owner
 * request 2026-09-04: "sort the exercises by the general muscle groups...
 * as well as other filters/sort options"). Kept dependency free of React so
 * it can be unit tested directly (scripts/test-exercise-filters.ts) and
 * reused by any future consumer (search, "Add exercise" picker, etc.).
 *
 * Operates over a minimal shape (ExerciseFilterEntry) rather than the full
 * LibraryExerciseEntry so this file has no dependency on
 * app/exercises/merge-exercise-sources.ts.
 */

import type { Equipment, ExerciseCategory, MuscleGroup } from './program-types';
import { EQUIPMENT_ORDER, MUSCLE_GROUP_LABELS, MUSCLE_GROUP_ORDER } from './muscle-group-copy';
import { CATEGORY_LABELS, CATEGORY_ORDER } from '../../app/exercises/exercise-category-copy';

/** The subset of LibraryExerciseEntry the filter and grouping logic needs. */
export interface ExerciseFilterEntry {
  id: string;
  name: string;
  category: ExerciseCategory;
  primaryMuscles: string[];
  muscleGroup?: MuscleGroup;
  equipment?: Equipment[];
}

export type ExerciseSort = 'muscle-group' | 'name' | 'category';

export interface ExerciseFilterState {
  query: string;
  muscleGroup: MuscleGroup | 'all';
  category: ExerciseCategory | 'all';
  equipment: Equipment | 'all';
  sort: ExerciseSort;
}

export const DEFAULT_EXERCISE_FILTERS: ExerciseFilterState = {
  query: '',
  muscleGroup: 'all',
  category: 'all',
  equipment: 'all',
  sort: 'muscle-group',
};

/** Bucket key and label for the trailing group of exercises with no
 * catalog muscle group (program-only entries the catalog has no match
 * for). Sorted to the end of a muscle-group grouping, never mixed in. */
const OTHER_GROUP_KEY = 'other';
const OTHER_GROUP_LABEL = 'Other';

export interface ExerciseGroup<T> {
  key: string;
  label: string | null;
  items: T[];
}

function matchesQuery(entry: ExerciseFilterEntry, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true;
  if (entry.name.toLowerCase().includes(normalizedQuery)) return true;
  return entry.primaryMuscles.some((muscle) => muscle.toLowerCase().includes(normalizedQuery));
}

/** Filters entries by search text, muscle group, category, and equipment,
 * then sorts them alphabetically by name. Grouping (by muscle group or
 * category) happens separately in groupExercises. */
export function filterAndSortExercises<T extends ExerciseFilterEntry>(
  entries: T[],
  state: ExerciseFilterState
): T[] {
  const normalizedQuery = state.query.trim().toLowerCase();
  return entries
    .filter((entry) => matchesQuery(entry, normalizedQuery))
    .filter((entry) => state.muscleGroup === 'all' || entry.muscleGroup === state.muscleGroup)
    .filter((entry) => state.category === 'all' || entry.category === state.category)
    .filter((entry) => state.equipment === 'all' || (entry.equipment ?? []).includes(state.equipment))
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Groups an already filtered/sorted list for display. 'muscle-group' groups
 * by MuscleGroup in MUSCLE_GROUP_ORDER, with entries that have no
 * muscleGroup (program-only, unmatched by the catalog) collected in a
 * trailing "Other" bucket. 'category' groups by ExerciseCategory in
 * declaration order. 'name' returns one flat group with a null label (no
 * section heading), preserving the already-alphabetical order.
 */
export function groupExercises<T extends ExerciseFilterEntry>(
  entries: T[],
  sort: ExerciseSort
): ExerciseGroup<T>[] {
  if (sort === 'name') {
    return entries.length > 0 ? [{ key: 'all', label: null, items: entries }] : [];
  }

  if (sort === 'category') {
    const byCategory = new Map<ExerciseCategory, T[]>();
    for (const entry of entries) {
      const bucket = byCategory.get(entry.category);
      if (bucket) bucket.push(entry);
      else byCategory.set(entry.category, [entry]);
    }
    return CATEGORY_ORDER.map((category) => ({
      key: category,
      label: CATEGORY_LABELS[category],
      items: byCategory.get(category) ?? [],
    })).filter((group) => group.items.length > 0);
  }

  // sort === 'muscle-group'
  const byGroup = new Map<MuscleGroup, T[]>();
  const other: T[] = [];
  for (const entry of entries) {
    if (!entry.muscleGroup) {
      other.push(entry);
      continue;
    }
    const bucket = byGroup.get(entry.muscleGroup);
    if (bucket) bucket.push(entry);
    else byGroup.set(entry.muscleGroup, [entry]);
  }
  const groups: ExerciseGroup<T>[] = MUSCLE_GROUP_ORDER.map((group) => ({
    key: group,
    label: MUSCLE_GROUP_LABELS[group],
    items: byGroup.get(group) ?? [],
  })).filter((group) => group.items.length > 0);
  if (other.length > 0) {
    groups.push({ key: OTHER_GROUP_KEY, label: OTHER_GROUP_LABEL, items: other });
  }
  return groups;
}

/** Equipment values actually present across entries, in EQUIPMENT_ORDER
 * order, for populating the equipment filter without offering dead
 * options. */
export function availableEquipment(entries: ExerciseFilterEntry[]): Equipment[] {
  const present = new Set<Equipment>();
  for (const entry of entries) {
    for (const item of entry.equipment ?? []) {
      present.add(item);
    }
  }
  return EQUIPMENT_ORDER.filter((equipment) => present.has(equipment));
}
