/**
 * Tests for the `superset:` clause in lib/program/parse-program-text.ts
 * (owner request 2026-09-17): two exercises performed back to back, one set
 * of each, resting only after both. See PROGRAM_FORMAT.md "Supersets" for
 * the paste syntax this exercises.
 *
 * Run with:
 *   npx tsx scripts/test-parse-superset.ts
 *
 * Exits non-zero on any failure.
 */

import { parseProgramText } from '../lib/program/parse-program-text';
import type { PrescribedExercise, ResolvedProgram, WorkoutSection } from '../lib/program/program-types';

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

function checkTrue(name: string, actual: boolean): void {
  check(name, actual, true);
}

function strengthSection(program: ResolvedProgram): WorkoutSection {
  const monday = program.templates.monday;
  if (monday.restDay) throw new Error('expected monday to be a training day');
  const section = monday.sections.find((s) => s.name === 'Strength');
  if (!section) throw new Error('expected a Strength section');
  return section;
}

function coreSection(program: ResolvedProgram): WorkoutSection {
  const monday = program.templates.monday;
  if (monday.restDay) throw new Error('expected monday to be a training day');
  const section = monday.sections.find((s) => s.name === 'Core');
  if (!section) throw new Error('expected a Core section');
  return section;
}

function byExerciseId(exercises: PrescribedExercise[], id: string): PrescribedExercise {
  const found = exercises.find((e) => e.exerciseId === id);
  if (!found) throw new Error(`expected an exercise with id "${id}"`);
  return found;
}

// --- A two member pair gets supersetGroup 'A' on both, contiguous orders ---
{
  const text = `# Test Program

## Monday: Test Day
### Strength (strength)
- Dumbbell Bench Press: 3 x 8-12 | superset: A
- Chest-Supported Row: 3 x 8-12 | superset: A
`;
  const result = parseProgramText(text);
  check('two member pair: zero errors', result.errors, []);
  check('two member pair: zero warnings', result.warnings, []);
  const section = strengthSection(result.program!);
  const bench = byExerciseId(section.exercises, 'dumbbell-bench-press');
  const row = byExerciseId(section.exercises, 'chest-supported-row');
  check('two member pair: first member supersetGroup', bench.supersetGroup, 'A');
  check('two member pair: second member supersetGroup', row.supersetGroup, 'A');
  check('two member pair: orders contiguous 1, 2', [bench.order, row.order], [1, 2]);
}

// --- Lowercase token is normalized to uppercase ---
{
  const text = `# Test Program

## Monday: Test Day
### Strength (strength)
- Dumbbell Bench Press: 3 x 8-12 | superset: a
- Chest-Supported Row: 3 x 8-12 | superset: a
`;
  const result = parseProgramText(text);
  check('lowercase token: zero errors', result.errors, []);
  check('lowercase token: zero warnings', result.warnings, []);
  const section = strengthSection(result.program!);
  check(
    'lowercase token: normalized to uppercase on both members',
    section.exercises.map((e) => e.supersetGroup),
    ['A', 'A'],
  );
}

// --- A single-member "group" is not a superset: warning, field removed ---
{
  const text = `# Test Program

## Monday: Test Day
### Strength (strength)
- Dumbbell Bench Press: 3 x 8-12 | superset: A
- Chest-Supported Row: 3 x 8-12
`;
  const result = parseProgramText(text);
  check('single member: zero errors', result.errors, []);
  check('single member: exactly one warning', result.warnings.length, 1);
  checkTrue(
    'single member: warning names the lone group as treated as a normal exercise',
    result.warnings[0].includes('superset A in section "Strength" has only one exercise; it is treated as a normal exercise'),
  );
  const section = strengthSection(result.program!);
  const bench = byExerciseId(section.exercises, 'dumbbell-bench-press');
  check('single member: supersetGroup field removed', 'supersetGroup' in bench, false);
}

// --- Non-contiguous members are moved together and orders renumbered 1..n ---
{
  const text = `# Test Program

## Monday: Test Day
### Strength (strength)
- Dumbbell Bench Press: 3 x 8-12 | superset: A
- Overhead Press: 3 x 8-12
- Chest-Supported Row: 3 x 8-12 | superset: A
`;
  const result = parseProgramText(text);
  check('non-contiguous: zero errors', result.errors, []);
  check('non-contiguous: exactly one warning', result.warnings.length, 1);
  checkTrue(
    'non-contiguous: warning says the group was moved together',
    result.warnings[0].includes('superset A exercises in section "Strength" were not next to each other; they were moved together'),
  );
  const section = strengthSection(result.program!);
  check(
    'non-contiguous: group moved next to each other, the exercise between them pushed after',
    section.exercises.map((e) => e.exerciseId),
    ['dumbbell-bench-press', 'chest-supported-row', 'overhead-press'],
  );
  check(
    'non-contiguous: orders renumbered 1..n with nothing else lost',
    section.exercises.map((e) => e.order),
    [1, 2, 3],
  );
  const press = byExerciseId(section.exercises, 'overhead-press');
  check('non-contiguous: the displaced exercise keeps its own prescription', press.prescription, {
    type: 'repetitions',
    sets: 3,
    minReps: 8,
    maxReps: 12,
  });
  check('non-contiguous: the displaced exercise is not part of the group', 'supersetGroup' in press, false);
}

// --- Mismatched set counts: warning, but still grouped ---
{
  const text = `# Test Program

## Monday: Test Day
### Strength (strength)
- Dumbbell Bench Press: 3 x 8-12 | superset: A
- Chest-Supported Row: 4 x 8-12 | superset: A
`;
  const result = parseProgramText(text);
  check('mismatched sets: zero errors', result.errors, []);
  check('mismatched sets: exactly one warning', result.warnings.length, 1);
  checkTrue(
    'mismatched sets: warning names the differing counts',
    result.warnings[0].includes('superset A: set counts differ (3 and 4); the exercise with fewer sets finishes early'),
  );
  const section = strengthSection(result.program!);
  check(
    'mismatched sets: both members stay grouped',
    section.exercises.map((e) => e.supersetGroup),
    ['A', 'A'],
  );
}

// --- A qualitative member cannot be part of a superset: error ---
{
  const text = `# Test Program

## Monday: Test Day
### Strength (strength)
- Dynamic Warm-Up: Easy movement and light preparation. | superset: A
- Chest-Supported Row: 3 x 8-12 | superset: A
`;
  const result = parseProgramText(text);
  check('qualitative member: no program produced', result.program, undefined);
  checkTrue(
    'qualitative member: error names the conflict',
    result.errors.some((e) => e.includes('descriptive exercises cannot be part of a superset')),
  );
}

// --- An invalid superset token is an error naming the line ---
{
  const text = `# Test Program

## Monday: Test Day
### Strength (strength)
- Dumbbell Bench Press: 3 x 8-12 | superset: ABCD
- Chest-Supported Row: 3 x 8-12 | superset: ABCD
`;
  const result = parseProgramText(text);
  check('invalid token: no program produced', result.program, undefined);
  check('invalid token: one error per offending line', result.errors.length, 2);
  checkTrue(
    'invalid token: error names the bad token',
    result.errors.every((e) => e.includes('invalid superset token "ABCD"')),
  );
}

// --- The same token in two sections stays separate (section scoped) ---
{
  const text = `# Test Program

## Monday: Test Day
### Strength (strength)
- Dumbbell Bench Press: 3 x 8-12 | superset: A
- Chest-Supported Row: 3 x 8-12 | superset: A

### Core (core)
- Hanging Leg Raise: 3 x 8-12 | superset: A
- Cable Crunch: 3 x 8-12 | superset: A
`;
  const result = parseProgramText(text);
  check('two sections, same token: zero errors', result.errors, []);
  check('two sections, same token: zero warnings', result.warnings, []);
  const strength = strengthSection(result.program!);
  const core = coreSection(result.program!);
  check(
    'two sections, same token: strength section group orders 1, 2',
    strength.exercises.map((e) => e.order),
    [1, 2],
  );
  check(
    'two sections, same token: core section group orders independently 1, 2',
    core.exercises.map((e) => e.order),
    [1, 2],
  );
  check(
    'two sections, same token: both sections carry the token, unrelated to each other',
    [strength.exercises[0].supersetGroup, core.exercises[0].supersetGroup],
    ['A', 'A'],
  );
}

// --- A program with no superset clauses parses identically to before ---
{
  const text = `# Test Program

## Monday: Test Day
### Strength (strength)
- Dumbbell Bench Press: 3 x 8-12 | rest: heavy compound
- Chest-Supported Row: 3 x 8-12 | rest: moderate compound
`;
  const result = parseProgramText(text);
  check('no superset clauses: zero errors', result.errors, []);
  check('no superset clauses: zero warnings', result.warnings, []);
  const section = strengthSection(result.program!);
  checkTrue(
    'no superset clauses: no exercise carries a supersetGroup field',
    section.exercises.every((e) => !('supersetGroup' in e)),
  );
  check(
    'no superset clauses: orders unaffected',
    section.exercises.map((e) => e.order),
    [1, 2],
  );
}

console.log('');
console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
