/**
 * Tests for lib/program/exercise-filters.ts (the exercise library's search,
 * filter, sort, and grouping logic). Hand-built fixtures, not the real
 * catalog, in the style of scripts/test-slot-set-edits.ts.
 *
 * Run with:
 *   npx tsx scripts/test-exercise-filters.ts
 *
 * Exits non-zero on any failure.
 */

import {
  availableEquipment,
  DEFAULT_EXERCISE_FILTERS,
  filterAndSortExercises,
  groupExercises,
  type ExerciseFilterEntry,
  type ExerciseFilterState,
} from '../lib/program/exercise-filters';

let passed = 0;
let failed = 0;

function check(name: string, actual: unknown, expected: unknown): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passed += 1;
  } else {
    failed += 1;
    console.log(`FAIL: ${name} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
  }
}

function entry(overrides: Partial<ExerciseFilterEntry> & Pick<ExerciseFilterEntry, 'id' | 'name'>): ExerciseFilterEntry {
  return {
    category: 'hypertrophy',
    primaryMuscles: [],
    ...overrides,
  };
}

const benchPress = entry({
  id: 'barbell-bench-press',
  name: 'Barbell Bench Press',
  category: 'strength',
  primaryMuscles: ['chest'],
  muscleGroup: 'chest',
  equipment: ['barbell', 'bench'],
});
const dumbbellCurl = entry({
  id: 'dumbbell-curl',
  name: 'Dumbbell Curl',
  category: 'hypertrophy',
  primaryMuscles: ['biceps'],
  muscleGroup: 'biceps',
  equipment: ['dumbbell'],
});
const boxJump = entry({
  id: 'box-jump',
  name: 'Box Jump',
  category: 'power',
  primaryMuscles: ['quads', 'glutes'],
  muscleGroup: 'quads',
  equipment: ['box'],
});
const lSitHold = entry({
  id: 'l-sit',
  name: 'L Sit',
  category: 'calisthenics',
  primaryMuscles: ['core'],
  muscleGroup: 'core',
  equipment: ['parallettes'],
});
const programOnlyExercise = entry({
  id: 'mystery-lift',
  name: 'Mystery Lift',
  category: 'strength',
  primaryMuscles: ['back'],
  // no muscleGroup, no equipment: an unmatched program-only entry.
});

const allEntries = [benchPress, dumbbellCurl, boxJump, lSitHold, programOnlyExercise];

function withFilters(overrides: Partial<ExerciseFilterState>): ExerciseFilterState {
  return { ...DEFAULT_EXERCISE_FILTERS, ...overrides };
}

// --- filterAndSortExercises: query matching ---

check(
  'query matches name substring, case insensitive',
  filterAndSortExercises(allEntries, withFilters({ query: 'bench' })).map((e) => e.id),
  ['barbell-bench-press']
);

check(
  'query matches primary muscle substring',
  filterAndSortExercises(allEntries, withFilters({ query: 'BICEPS' })).map((e) => e.id),
  ['dumbbell-curl']
);

check(
  'empty query returns everything, sorted by name',
  filterAndSortExercises(allEntries, withFilters({})).map((e) => e.id),
  ['barbell-bench-press', 'box-jump', 'dumbbell-curl', 'l-sit', 'mystery-lift']
);

check(
  'query with no matches returns empty list',
  filterAndSortExercises(allEntries, withFilters({ query: 'nonexistent' })),
  []
);

// --- filterAndSortExercises: muscle group / category / equipment filters ---

check(
  'muscleGroup filter keeps only that group',
  filterAndSortExercises(allEntries, withFilters({ muscleGroup: 'chest' })).map((e) => e.id),
  ['barbell-bench-press']
);

check(
  'muscleGroup filter excludes entries with no muscleGroup',
  filterAndSortExercises(allEntries, withFilters({ muscleGroup: 'chest' })).some((e) => e.id === 'mystery-lift'),
  false
);

check(
  'category filter keeps only that category',
  filterAndSortExercises(allEntries, withFilters({ category: 'power' })).map((e) => e.id),
  ['box-jump']
);

check(
  'equipment filter keeps only entries listing that equipment',
  filterAndSortExercises(allEntries, withFilters({ equipment: 'dumbbell' })).map((e) => e.id),
  ['dumbbell-curl']
);

check(
  'equipment filter excludes entries with no equipment',
  filterAndSortExercises(allEntries, withFilters({ equipment: 'dumbbell' })).some((e) => e.id === 'mystery-lift'),
  false
);

check(
  'combined filters intersect',
  filterAndSortExercises(
    allEntries,
    withFilters({ category: 'strength', equipment: 'barbell' })
  ).map((e) => e.id),
  ['barbell-bench-press']
);

// --- groupExercises ---

check(
  'muscle-group sort groups by muscle group, unmatched entries land in Other at the end',
  groupExercises(allEntries, 'muscle-group').map((g) => g.key),
  ['chest', 'biceps', 'quads', 'core', 'other']
);

check(
  'muscle-group sort labels the Other bucket',
  groupExercises(allEntries, 'muscle-group').find((g) => g.key === 'other')?.label,
  'Other'
);

check(
  'muscle-group sort groups omit muscle groups with no entries',
  groupExercises(allEntries, 'muscle-group').some((g) => g.key === 'back'),
  false
);

check(
  'category sort groups by category',
  groupExercises(allEntries, 'category')
    .find((g) => g.key === 'strength')
    ?.items.map((e) => e.id)
    .sort(),
  ['barbell-bench-press', 'mystery-lift']
);

check(
  'name sort returns one flat group with a null label',
  groupExercises(allEntries, 'name').map((g) => g.label),
  [null]
);

check('name sort keeps every entry in the single group', groupExercises(allEntries, 'name')[0]?.items.length, 5);

check('grouping an empty list returns no groups', groupExercises([], 'muscle-group'), []);

// --- availableEquipment ---

check('availableEquipment returns present equipment in EQUIPMENT_ORDER order', availableEquipment(allEntries), [
  'barbell',
  'dumbbell',
  'bench',
  'parallettes',
  'box',
]);

check('availableEquipment ignores entries with no equipment field', availableEquipment([programOnlyExercise]), []);

console.log(`${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
