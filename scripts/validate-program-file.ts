/**
 * Validates any owner-authored program file (paste format, see
 * PROGRAM_FORMAT.md) through the real parser, before it is pasted into the
 * app. Prints parse errors/warnings, the resolved week, and which exercises
 * matched the guidance catalog ("Help me feel it" coverage).
 *
 * Run with:
 *   npx tsx scripts/validate-program-file.ts programs/block-1-athletic-muscle-base.md
 *
 * Exits non-zero on any parse error.
 */

import { readFileSync } from 'node:fs';
import { parseProgramText } from '../lib/program/parse-program-text';
import type { Prescription, Weekday } from '../lib/program/program-types';

const ALL_WEEKDAYS: Weekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const filePath = process.argv[2];
if (!filePath) {
  console.log('Usage: npx tsx scripts/validate-program-file.ts <path-to-program.md>');
  process.exit(1);
}

const sourceText = readFileSync(filePath, 'utf8');
const { program, errors, warnings } = parseProgramText(sourceText);

if (errors.length > 0) {
  console.log(`PARSE FAILED with ${errors.length} error(s):`);
  for (const error of errors) console.log(`  - ${error}`);
  process.exit(1);
}
if (!program) {
  console.log('PARSE FAILED: parser returned no program and no errors (parser bug).');
  process.exit(1);
}

if (warnings.length > 0) {
  console.log(`${warnings.length} warning(s):`);
  for (const warning of warnings) console.log(`  - ${warning}`);
  console.log('');
}

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
console.log(`PROGRAM: ${program.name}`);
console.log('='.repeat(72));

let totalExercises = 0;
let withGuidance = 0;
const withoutGuidance: string[] = [];

for (const weekday of ALL_WEEKDAYS) {
  const template = program.templates[weekday];
  console.log('');
  console.log(`${weekday.toUpperCase()}: ${template.name} (id: ${template.id})`);

  if (template.restDay) {
    console.log('  (rest day)');
    continue;
  }

  if (template.description) console.log(`  ${template.description}`);
  if (template.targetDurationMinutes) console.log(`  Target duration: ${template.targetDurationMinutes} min`);
  if (template.ultimatePracticeLater) console.log('  Ultimate practice later');

  for (const section of template.sections) {
    console.log(`  [${section.order}] ${section.name} (${section.type}${section.optional ? ', optional' : ''})`);
    for (const note of section.notes ?? []) console.log(`      note: ${note}`);

    for (const prescribedExercise of section.exercises) {
      const ids = [prescribedExercise.exerciseId, ...(prescribedExercise.alternativeExerciseIds ?? [])];
      const names: string[] = [];
      for (const id of ids) {
        const exercise = program.exercises[id];
        if (!exercise) {
          console.log(`      UNRESOLVED exerciseId "${id}"`);
          continue;
        }
        totalExercises += 1;
        const hasGuidance = Boolean(exercise.intendedFeeling || exercise.cues?.length);
        if (hasGuidance) withGuidance += 1;
        else withoutGuidance.push(exercise.name);
        names.push(`${exercise.name}${hasGuidance ? ' [guidance]' : ''}`);
      }
      const restGuidance = prescribedExercise.restCategory ? ` | rest: ${prescribedExercise.restCategory}` : '';
      console.log(`      - ${names.join(' or ')}: ${formatPrescription(prescribedExercise.prescription)}${restGuidance}`);
      for (const note of prescribedExercise.notes ?? []) console.log(`          note: ${note}`);
    }
  }
}

console.log('');
console.log('='.repeat(72));
console.log(`Exercise slots (choice alternatives counted separately): ${totalExercises}`);
console.log(`With catalog guidance ("Help me feel it"): ${withGuidance}`);
if (withoutGuidance.length > 0) {
  console.log('Without guidance (still fully usable, just no coaching content):');
  for (const name of [...new Set(withoutGuidance)]) console.log(`  - ${name}`);
}
console.log('');
console.log('PARSE PASSED');
process.exit(0);
