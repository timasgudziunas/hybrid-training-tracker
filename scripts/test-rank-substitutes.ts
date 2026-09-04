/**
 * Tests for lib/program/rank-substitutes.ts — the 2026-09-04 swap picker
 * rework that recommends exercises targeting the same muscles instead of
 * only sorting the full catalog by section category. Pre-registered
 * assertions, in the style of scripts/test-session-deviations.ts.
 *
 * Run with:
 *   npx tsx scripts/test-rank-substitutes.ts
 *
 * Exits non-zero on any failure.
 */

import { rankSubstitutes, similarityScore } from '../lib/program/rank-substitutes';
import type { Exercise } from '../lib/program/program-types';

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

function ids(exercises: Exercise[]): string[] {
  return exercises.map((exercise) => exercise.id);
}

function exercise(overrides: Partial<Exercise> & { id: string; name: string }): Exercise {
  return {
    category: 'strength',
    primaryMuscles: [],
    secondaryMuscles: [],
    progressionType: 'none',
    ...overrides,
  };
}

const calfRaise = exercise({ id: 'calf-raise', name: 'Calf Raise', category: 'strength', primaryMuscles: ['calves'] });
const seatedCalfRaise = exercise({
  id: 'seated-calf-raise',
  name: 'Seated Calf Raise',
  category: 'strength',
  primaryMuscles: ['calves'],
});
const legPress = exercise({
  id: 'leg-press',
  name: 'Leg Press',
  category: 'strength',
  primaryMuscles: ['quads'],
  secondaryMuscles: ['calves'],
});
const legExtension = exercise({
  id: 'leg-extension',
  name: 'Leg Extension',
  category: 'hypertrophy',
  primaryMuscles: ['quads'],
});
const boxJump = exercise({ id: 'box-jump', name: 'Box Jump', category: 'power', primaryMuscles: ['quads', 'glutes'] });
const wristPrep = exercise({ id: 'wrist-prep', name: 'Wrist Preparation', category: 'mobility', primaryMuscles: ['wrists'] });

// --- similarityScore: shared primary muscle ranks above only-secondary ---
{
  const sharedPrimaryScore = similarityScore(calfRaise, seatedCalfRaise); // both primary calves
  const onlySecondaryScore = similarityScore(calfRaise, legPress); // calf-raise primary calves matches legPress secondary calves
  check('shared primary muscle scores higher than only-secondary match', sharedPrimaryScore > onlySecondaryScore, true);
}

// --- same category adds to the score ---
{
  const withSameCategory = exercise({ id: 'x', name: 'X', category: 'strength', primaryMuscles: ['calves'] });
  const withDifferentCategory = exercise({ id: 'y', name: 'Y', category: 'hypertrophy', primaryMuscles: ['calves'] });
  const scoreSameCategory = similarityScore(calfRaise, withSameCategory);
  const scoreDifferentCategory = similarityScore(calfRaise, withDifferentCategory);
  check('same category adds to the score', scoreSameCategory > scoreDifferentCategory, true);
}

// --- unrelated exercise lands in others ---
{
  const { similar, others } = rankSubstitutes(calfRaise, [seatedCalfRaise, wristPrep], 'strength');
  check('unrelated exercise (no shared muscle/category) lands in others', ids(others), ['wrist-prep']);
  check('related exercise lands in similar', ids(similar), ['seated-calf-raise']);
}

// --- current exercise excluded ---
{
  const { similar, others } = rankSubstitutes(calfRaise, [calfRaise, seatedCalfRaise], 'strength');
  check('current exercise excluded from similar', ids(similar).includes('calf-raise'), false);
  check('current exercise excluded from others', ids(others).includes('calf-raise'), false);
}

// --- explicit substitutions are in similar even at score 0 ---
{
  const calfRaiseWithSub = { ...calfRaise, substitutions: ['wrist-prep'] };
  const { similar } = rankSubstitutes(calfRaiseWithSub, [wristPrep, seatedCalfRaise], 'strength');
  check('explicit substitution (score 0) appears in similar', ids(similar).includes('wrist-prep'), true);
  check('explicit substitution is listed first', ids(similar)[0], 'wrist-prep');
}

// --- ordering by score then name is stable ---
{
  // leg-extension: primary quads matches leg-press primary quads (2) -> vs
  // box-jump: primary quads matches (2) + also glutes (no match) = 2, so
  // leg-extension and box-jump could tie; use name as tiebreak.
  const legPressLikeCurrent = exercise({ id: 'squat', name: 'Squat', category: 'strength', primaryMuscles: ['quads'] });
  const { similar } = rankSubstitutes(legPressLikeCurrent, [boxJump, legExtension, legPress], 'strength');
  // legPress: shares category (strength) + primary quads = 2 + 1 = 3
  // boxJump: primary quads match = 2, different category = 2
  // legExtension: primary quads match = 2, different category = 2
  // Expect legPress first (score 3), then boxJump/legExtension tied at 2, ordered by name.
  check('ordering by score desc then name asc', ids(similar), ['leg-press', 'box-jump', 'leg-extension']);
}

console.log('');
console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
