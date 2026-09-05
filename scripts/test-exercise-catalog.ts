/**
 * Tests for the R10 exercise catalog (lib/program/catalog/*.ts, assembled
 * by lib/program/exercise-catalog.ts). Pre-registered assertions, in the
 * style of scripts/test-slot-set-edits.ts.
 *
 * Run with:
 *   npx tsx scripts/test-exercise-catalog.ts
 *
 * Exits non-zero on any failure.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { EXERCISE_CATALOG } from '../lib/program/exercise-catalog';
import { normalizeExerciseNameForMatch, slugifyExerciseName } from '../lib/program/slugify-exercise-name';
import { MUSCLE_GROUP_ORDER, EQUIPMENT_ORDER } from '../lib/program/muscle-group-copy';
import { L_SIT_PROGRESSION, PLANCHE_PROGRESSION } from '../lib/program/progression-chains';
import { parseProgramText } from '../lib/program/parse-program-text';

const PROGRESSION_CHAINS = [L_SIT_PROGRESSION, PLANCHE_PROGRESSION];

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string): void {
  if (condition) {
    passed += 1;
  } else {
    failed += 1;
    console.log(`FAIL: ${name}${detail ? ` (${detail})` : ''}`);
  }
}

// --- Catalog size ---

check(
  'catalog has at least 240 entries',
  EXERCISE_CATALOG.length >= 240,
  `got ${EXERCISE_CATALOG.length}`
);

// --- Uniqueness ---

{
  const idCounts = new Map<string, number>();
  const nameCounts = new Map<string, number>();
  for (const exercise of EXERCISE_CATALOG) {
    idCounts.set(exercise.id, (idCounts.get(exercise.id) ?? 0) + 1);
    const normalized = normalizeExerciseNameForMatch(exercise.name);
    nameCounts.set(normalized, (nameCounts.get(normalized) ?? 0) + 1);
  }
  for (const [id, count] of idCounts) {
    check(`id "${id}" is unique`, count === 1, `appears ${count} times`);
  }
  for (const [normalized, count] of nameCounts) {
    check(`normalized name "${normalized}" is unique`, count === 1, `appears ${count} times`);
  }
}

// --- Per-entry field checks ---

const DASH_PATTERN = /[–—]| - /;
const BANNED_NAME_PATTERN =
  /\b(run|runs|running|jog|jogging|sprint|sprints|sprinting|treadmill|acceleration|accelerations|shuttle)\b/i;

function collectStrings(value: unknown, out: string[]): void {
  if (typeof value === 'string') {
    out.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out);
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectStrings(item, out);
  }
}

for (const exercise of EXERCISE_CATALOG) {
  const label = `${exercise.id} (${exercise.name})`;

  check(
    `${label}: id equals slugifyExerciseName(name)`,
    exercise.id === slugifyExerciseName(exercise.name),
    `expected "${slugifyExerciseName(exercise.name)}", got "${exercise.id}"`
  );

  check(
    `${label}: muscleGroup is a known MuscleGroup`,
    exercise.muscleGroup !== undefined && (MUSCLE_GROUP_ORDER as string[]).includes(exercise.muscleGroup),
    `muscleGroup=${String(exercise.muscleGroup)}`
  );

  const equipment = exercise.equipment ?? [];
  check(`${label}: equipment is non-empty`, equipment.length > 0);
  for (const item of equipment) {
    check(
      `${label}: equipment value "${item}" is a known Equipment`,
      (EQUIPMENT_ORDER as string[]).includes(item)
    );
  }

  check(`${label}: defaultPrescription is present`, exercise.defaultPrescription !== undefined);
  check(
    `${label}: intendedFeeling is non-empty`,
    typeof exercise.intendedFeeling === 'string' && exercise.intendedFeeling.trim().length > 0
  );
  check(
    `${label}: cues has at least 3 entries`,
    Array.isArray(exercise.cues) && exercise.cues.length >= 3,
    `got ${exercise.cues?.length ?? 0}`
  );
  check(
    `${label}: commonMistakes has at least 2 entries`,
    Array.isArray(exercise.commonMistakes) && exercise.commonMistakes.length >= 2,
    `got ${exercise.commonMistakes?.length ?? 0}`
  );

  check(
    `${label}: name has no banned running word`,
    !BANNED_NAME_PATTERN.test(exercise.name)
  );

  const allStrings: string[] = [];
  collectStrings(exercise, allStrings);
  const offendingString = allStrings.find((s) => DASH_PATTERN.test(s));
  check(
    `${label}: no string field contains an em dash, en dash, or " - "`,
    offendingString === undefined,
    offendingString ? `found in "${offendingString}"` : undefined
  );

  if (exercise.substitutions) {
    for (const subId of exercise.substitutions) {
      check(
        `${label}: substitution "${subId}" exists in the catalog`,
        EXERCISE_CATALOG.some((e) => e.id === subId)
      );
    }
  }

  if (exercise.progressionChainId) {
    check(
      `${label}: progressionChainId "${exercise.progressionChainId}" references a chain that exists`,
      PROGRESSION_CHAINS.some((chain) => chain.id === exercise.progressionChainId)
    );
  }

  check(
    `${label}: category 'cardio' iff muscleGroup 'cardio'`,
    (exercise.category === 'cardio') === (exercise.muscleGroup === 'cardio')
  );

  check(`${label}: category is never 'speed'`, (exercise.category as string) !== 'speed');
}

// --- Real program parses cleanly against the catalog ---

const REMOVED_RUNNING_WORK_ALLOWLIST = new Set(['acceleration', 'sprint', 'dynamicsprintwarmup']);
// Block 1 names folded into a canonical library entry in the 2026-09-05
// overlap cleanup (Calf Raise -> Standing Calf Raise, Easy Cycling ->
// Stationary Bike, L-Sit Practice -> L-Sit, Lower and Upper Body Mobility ->
// Mobility Flow). They still parse; they simply carry no library guidance.
const MERGED_DUPLICATE_ALLOWLIST = new Set(['calfraise', 'easycycling', 'lsitpractice', 'lowerandupperbodymobility']);

try {
  const programPath = join(__dirname, '..', 'programs', 'block-1-athletic-muscle-base.md');
  const programText = readFileSync(programPath, 'utf-8');
  const result = parseProgramText(programText);

  check('block-1-athletic-muscle-base.md parses with zero errors', result.errors.length === 0, result.errors.join('; '));

  if (result.program) {
    for (const exercise of Object.values(result.program.exercises)) {
      const normalized = normalizeExerciseNameForMatch(exercise.name);
      if (REMOVED_RUNNING_WORK_ALLOWLIST.has(normalized) || MERGED_DUPLICATE_ALLOWLIST.has(normalized)) continue;
      check(
        `program exercise "${exercise.name}" matched catalog guidance (intendedFeeling present)`,
        typeof exercise.intendedFeeling === 'string' && exercise.intendedFeeling.trim().length > 0
      );
    }
  } else {
    check('block-1-athletic-muscle-base.md produced a program', false, 'program is undefined');
  }
} catch (err) {
  check('block-1-athletic-muscle-base.md is readable and parses', false, String(err));
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
