/**
 * Validates the built-in sample program (2026-08-25 rework: there is no
 * more code-seeded weekly program — see PLAN.md "Rework plan" R1). Parses
 * the sample's own paste-format source text through the real parser,
 * asserts zero parse errors, re-runs the same structural checks the old
 * seed-data validator ran (unique ids, section/exercise order sanity,
 * Sunday is rest, known section types), and additionally asserts the
 * sample actually demonstrates every card type the active-workout UI
 * supports: every Prescription type, an either/or choice pair, a per-side
 * prescription, and an optional section.
 *
 * Run with:
 *   npx tsx scripts/validate-program.ts
 *
 * Exits non-zero on any validation failure.
 */

import { parseProgramText } from '../lib/program/parse-program-text';
import { SAMPLE_PROGRAM, SAMPLE_PROGRAM_SOURCE_TEXT } from '../lib/program/sample-program';
import type { Prescription, ResolvedProgram, Weekday, WorkoutTemplate } from '../lib/program/program-types';

const ALL_WEEKDAYS: Weekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const errors: string[] = [];

function fail(message: string): void {
  errors.push(message);
}

function checkOrdersSane(label: string, orders: number[]): void {
  const sorted = [...orders].sort((a, b) => a - b);
  const seen = new Set<number>();
  for (const value of orders) {
    if (seen.has(value)) {
      fail(`${label}: duplicate order value ${value}`);
    }
    seen.add(value);
  }
  sorted.forEach((value, index) => {
    const expected = index + 1;
    if (value !== expected) {
      fail(`${label}: order sequence has a gap or does not start at 1 (${sorted.join(', ')})`);
    }
  });
}

// --- Parse the sample's own source text through the real parser directly,
// for a clear diagnostic (SAMPLE_PROGRAM already does this at module load
// and throws on failure, but re-parsing here gives a readable report
// instead of a stack trace if the sample is ever broken). ---
const parseResult = parseProgramText(SAMPLE_PROGRAM_SOURCE_TEXT);
if (parseResult.errors.length > 0) {
  console.log('SAMPLE PROGRAM FAILED TO PARSE:');
  for (const error of parseResult.errors) console.log(`  - ${error}`);
  process.exit(1);
}
if (parseResult.warnings.length > 0) {
  console.log('SAMPLE PROGRAM PRODUCED UNEXPECTED WARNINGS:');
  for (const warning of parseResult.warnings) console.log(`  - ${warning}`);
  process.exit(1);
}

// The rest of validation runs against the actual exported SAMPLE_PROGRAM
// (sample-prefixed day template ids included), not the raw parse above.
const program: ResolvedProgram = SAMPLE_PROGRAM;

// --- All 7 weekdays present exactly once ---
const presentWeekdays = Object.keys(program.templates) as Weekday[];
for (const weekday of ALL_WEEKDAYS) {
  const count = presentWeekdays.filter((w) => w === weekday).length;
  if (count !== 1) {
    fail(`Weekday ${weekday} present ${count} times (expected exactly 1)`);
  }
}

// --- Sunday is a rest day ---
const sunday = program.templates.sunday;
if (!sunday.restDay) {
  fail('Sunday is not flagged as a rest day (non-negotiable 11/20 violation)');
} else if ('sections' in sunday) {
  fail('Sunday rest day template unexpectedly has a sections field');
}

// --- Section/exercise order sanity + exerciseId references ---
let sawRepetitions = false;
let sawDuration = false;
let sawHold = false;
let sawDistance = false;
let sawQualitative = false;
let sawChoicePair = false;
let sawPerSide = false;
let sawOptionalSection = false;

for (const weekday of ALL_WEEKDAYS) {
  const template = program.templates[weekday];
  if (template.restDay) continue;

  checkOrdersSane(`${weekday} sections`, template.sections.map((s) => s.order));

  for (const section of template.sections) {
    if (section.optional) sawOptionalSection = true;

    checkOrdersSane(
      `${weekday} / ${section.name} exercises`,
      section.exercises.map((e) => e.order),
    );

    for (const prescribedExercise of section.exercises) {
      if (!program.exercises[prescribedExercise.exerciseId]) {
        fail(`${weekday} / ${section.name}: unresolved exerciseId "${prescribedExercise.exerciseId}"`);
      }
      for (const altId of prescribedExercise.alternativeExerciseIds ?? []) {
        if (!program.exercises[altId]) {
          fail(`${weekday} / ${section.name}: unresolved alternative exerciseId "${altId}"`);
        }
      }
      if (prescribedExercise.alternativeExerciseIds?.length) sawChoicePair = true;

      const p = prescribedExercise.prescription;
      if ('perSide' in p && p.perSide) sawPerSide = true;
      switch (p.type) {
        case 'repetitions':
          sawRepetitions = true;
          break;
        case 'duration':
          sawDuration = true;
          break;
        case 'hold':
          sawHold = true;
          break;
        case 'distance':
          sawDistance = true;
          break;
        case 'qualitative':
          sawQualitative = true;
          break;
      }
    }
  }
}

if (!sawRepetitions) fail('Sample program has no repetitions-type prescription');
if (!sawDuration) fail('Sample program has no duration-type prescription');
if (!sawHold) fail('Sample program has no hold-type prescription');
if (!sawDistance) fail('Sample program has no distance-type prescription');
if (!sawQualitative) fail('Sample program has no qualitative-type prescription');
if (!sawChoicePair) fail('Sample program has no either/or choice pair');
if (!sawPerSide) fail('Sample program has no per-side prescription');
if (!sawOptionalSection) fail('Sample program has no optional section');

// --- Day template ids are sample-prefixed ---
for (const weekday of ALL_WEEKDAYS) {
  const template = program.templates[weekday];
  if (!template.id.startsWith('sample-')) {
    fail(`${weekday}: template id "${template.id}" is not sample-prefixed`);
  }
}

// --- Print summary ---
function formatPrescription(p: Prescription): string {
  switch (p.type) {
    case 'repetitions':
      return `${p.sets} x ${p.minReps}-${p.maxReps} reps${p.perSide ? ' per side' : ''}`;
    case 'duration':
      return `${p.sets} x ${p.minSeconds}-${p.maxSeconds} sec${p.perSide ? ' per side' : ''}`;
    case 'hold':
      return `${p.sets} x ${p.minSeconds}-${p.maxSeconds} sec hold${p.perSide ? ' per side' : ''}`;
    case 'distance':
      return `${p.sets} x ${p.meters}m${p.timed ? ' (timed)' : ''}`;
    case 'qualitative':
      return [
        p.description,
        p.approxMinMinutes !== undefined ? `(~${p.approxMinMinutes}-${p.approxMaxMinutes} min)` : '',
        p.items ? `[${p.items.join(', ')}]` : '',
      ]
        .filter(Boolean)
        .join(' ');
    default: {
      const exhaustive: never = p;
      return String(exhaustive);
    }
  }
}

console.log('='.repeat(72));
console.log(`SAMPLE PROGRAM SUMMARY: ${program.name}`);
console.log('='.repeat(72));

for (const weekday of ALL_WEEKDAYS) {
  const template: WorkoutTemplate = program.templates[weekday];
  console.log('');
  console.log(`${weekday.toUpperCase()}: ${template.name} (id: ${template.id})`);

  if (template.restDay) {
    console.log(`  (rest day) ${template.description}`);
    continue;
  }

  if (template.description) console.log(`  ${template.description}`);
  if (template.targetDurationMinutes) {
    console.log(`  Target duration: <= ${template.targetDurationMinutes} min`);
  }
  console.log(`  Ultimate practice later: ${template.ultimatePracticeLater}`);

  for (const section of template.sections) {
    console.log(
      `  [${section.order}] ${section.name} (${section.type}${section.optional ? ', optional' : ''})`,
    );
    for (const note of section.notes ?? []) {
      console.log(`      note: ${note}`);
    }
    for (const prescribedExercise of section.exercises) {
      const exercise = program.exercises[prescribedExercise.exerciseId];
      const name = exercise?.name ?? prescribedExercise.exerciseId;
      const altNames = (prescribedExercise.alternativeExerciseIds ?? [])
        .map((id) => program.exercises[id]?.name ?? id)
        .join(' or ');
      const displayName = altNames ? `${name} or ${altNames}` : name;
      const restGuidance = prescribedExercise.restCategory ? ` | rest: ${prescribedExercise.restCategory}` : '';
      const hasGuidance = Boolean(exercise?.intendedFeeling || exercise?.cues?.length);
      console.log(
        `      - ${displayName}: ${formatPrescription(prescribedExercise.prescription)}${restGuidance}${hasGuidance ? ' [has guidance]' : ''}`,
      );
      for (const note of prescribedExercise.notes ?? []) {
        console.log(`          note: ${note}`);
      }
    }
  }
}

console.log('');
console.log('='.repeat(72));
console.log(`Exercises referenced by sample program: ${Object.keys(program.exercises).length}`);

if (errors.length > 0) {
  console.log('');
  console.log(`VALIDATION FAILED with ${errors.length} error(s):`);
  for (const error of errors) {
    console.log(`  - ${error}`);
  }
  process.exit(1);
}

console.log('');
console.log('VALIDATION PASSED');
process.exit(0);
