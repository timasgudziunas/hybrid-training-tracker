/**
 * Validates and prints the canonical weekly training program.
 *
 * Run with:
 *   npx tsx scripts/validate-program.ts
 *
 * Checks:
 * - Every referenced exerciseId (primary + alternatives) exists in the catalog.
 * - No duplicate catalog ids.
 * - All 7 weekdays present exactly once.
 * - Sunday is a rest day with zero sections.
 * - Monday/Wednesday/Thursday are flagged ultimatePracticeLater.
 * - Section orders and exercise orders are sane (start at 1, no gaps, no duplicates).
 *
 * Exits non-zero on any validation failure.
 */

import { WEEKLY_PROGRAM } from '../lib/program/weekly-program';
import { EXERCISE_CATALOG, findExerciseById } from '../lib/program/exercise-catalog';
import { REST_GUIDANCE_BY_CATEGORY } from '../lib/program/rest-guidance';
import type { Weekday, WorkoutTemplate, Prescription } from '../lib/program/program-types';

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

// --- 1. Duplicate catalog ids ---
const catalogIds = new Set<string>();
for (const exercise of EXERCISE_CATALOG) {
  if (catalogIds.has(exercise.id)) {
    fail(`Duplicate exercise catalog id: ${exercise.id}`);
  }
  catalogIds.add(exercise.id);
}

// --- 2. All 7 weekdays present exactly once ---
const presentWeekdays = Object.keys(WEEKLY_PROGRAM) as Weekday[];
for (const weekday of ALL_WEEKDAYS) {
  const count = presentWeekdays.filter((w) => w === weekday).length;
  if (count !== 1) {
    fail(`Weekday ${weekday} present ${count} times (expected exactly 1)`);
  }
}
if (presentWeekdays.length !== ALL_WEEKDAYS.length) {
  fail(`WEEKLY_PROGRAM has ${presentWeekdays.length} entries, expected ${ALL_WEEKDAYS.length}`);
}

// --- 3. Sunday is a rest day with zero sections ---
const sunday = WEEKLY_PROGRAM.sunday;
if (!sunday.restDay) {
  fail('Sunday is not flagged as a rest day (non-negotiable 11/20 violation)');
} else if ('sections' in sunday) {
  fail('Sunday rest day template unexpectedly has a sections field');
}

// --- 4. Ultimate practice flagged Mon/Wed/Thu ---
const expectedUltimateDays: Weekday[] = ['monday', 'wednesday', 'thursday'];
for (const weekday of ALL_WEEKDAYS) {
  const template = WEEKLY_PROGRAM[weekday];
  if (template.restDay) continue;
  const expected = expectedUltimateDays.includes(weekday);
  if (template.ultimatePracticeLater !== expected) {
    fail(
      `${weekday}: ultimatePracticeLater is ${template.ultimatePracticeLater}, expected ${expected}`,
    );
  }
}

// --- 5. exerciseId references + section/exercise order sanity ---
for (const weekday of ALL_WEEKDAYS) {
  const template = WEEKLY_PROGRAM[weekday];
  if (template.restDay) continue;

  checkOrdersSane(`${weekday} sections`, template.sections.map((s) => s.order));

  for (const section of template.sections) {
    checkOrdersSane(
      `${weekday} / ${section.name} exercises`,
      section.exercises.map((e) => e.order),
    );

    for (const prescribedExercise of section.exercises) {
      const primary = findExerciseById(prescribedExercise.exerciseId);
      if (!primary) {
        fail(
          `${weekday} / ${section.name}: unknown exerciseId "${prescribedExercise.exerciseId}"`,
        );
      }
      for (const altId of prescribedExercise.alternativeExerciseIds ?? []) {
        if (!findExerciseById(altId)) {
          fail(
            `${weekday} / ${section.name}: unknown alternative exerciseId "${altId}" (for ${prescribedExercise.exerciseId})`,
          );
        }
      }
      if (
        prescribedExercise.restCategory &&
        !(prescribedExercise.restCategory in REST_GUIDANCE_BY_CATEGORY)
      ) {
        fail(
          `${weekday} / ${section.name}: unknown restCategory "${prescribedExercise.restCategory}"`,
        );
      }
    }
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
        p.approxMinMinutes !== undefined
          ? `(~${p.approxMinMinutes}-${p.approxMaxMinutes} min)`
          : '',
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
console.log('WEEKLY TRAINING PROGRAM SUMMARY');
console.log('='.repeat(72));

for (const weekday of ALL_WEEKDAYS) {
  const template: WorkoutTemplate = WEEKLY_PROGRAM[weekday];
  console.log('');
  console.log(`${weekday.toUpperCase()}: ${template.name}`);

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
      const exercise = findExerciseById(prescribedExercise.exerciseId);
      const name = exercise?.name ?? prescribedExercise.exerciseId;
      const altNames = (prescribedExercise.alternativeExerciseIds ?? [])
        .map((id) => findExerciseById(id)?.name ?? id)
        .join(' or ');
      const displayName = altNames ? `${name} or ${altNames}` : name;
      const restGuidance = prescribedExercise.restCategory
        ? ` | rest: ${REST_GUIDANCE_BY_CATEGORY[prescribedExercise.restCategory].guidance}`
        : '';
      console.log(
        `      - ${displayName}: ${formatPrescription(prescribedExercise.prescription)}${restGuidance}`,
      );
      for (const note of prescribedExercise.notes ?? []) {
        console.log(`          note: ${note}`);
      }
    }
  }
}

console.log('');
console.log('='.repeat(72));
console.log(`Exercise catalog size: ${EXERCISE_CATALOG.length}`);

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
