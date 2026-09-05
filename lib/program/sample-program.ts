/**
 * The built-in sample program (2026-08-25 rework): shown on the Today
 * screen and runnable as a real workout whenever no program has been
 * pasted yet. Written as ordinary paste-format source text and parsed
 * through the same parseProgramText the paste screen uses, so the sample
 * also exercises the parser on every load — if this source text were ever
 * broken, the app would fail to build/start rather than ship a silently
 * wrong sample. scripts/validate-program.ts asserts it parses clean and
 * covers every Prescription type plus a choice pair, a per-side
 * prescription, and an optional section.
 *
 * Day template ids are prefixed `sample-` (e.g. `sample-monday`) so sample
 * workout_sessions rows are identifiable and can be excluded from future
 * adherence stats (R4) without touching real program history.
 */

import { parseProgramText } from './parse-program-text';
import type { ResolvedProgram, WorkoutTemplate } from './program-types';

export const SAMPLE_PROGRAM_SOURCE_TEXT = `# Sample Program

## Monday: Sample Full Body
A quick tour of every card type the app supports. Replace this with your real program from the paste screen at /program.
Target duration: 60 minutes
+ Ultimate practice later

### Warm-Up (warmup)
- Dynamic Warm-Up: Easy movement and joint preparation before training. (~8-10 min)
  - Leg swings
  - Arm circles
  - Bodyweight squats
  - Walking lunges

### Strength (strength)
- Hack Squat: 3 x 6-10 | rest: heavy compound | notes: brace before every rep
- Face Pull / Reverse Cable Fly: 3 x 12-15 | rest: isolation
- Bulgarian Split Squat: 2 x 8-12 each side | rest: moderate compound
- Cable Woodchop: 3 x 10-12 | rest: isolation

### Carries (strength)
> Walk tall, brace, and breathe. Set the weight down under control.
- Farmer Carry: 3 x 30m | rest: moderate compound

### Calisthenics (calisthenics)
- Wrist Preparation: 1 x 120-180s
- Short-Lever Copenhagen Plank: 2 x 15-20s hold, each side | rest: calisthenics skill
- L-Sit: Four to five high quality attempts.

### Recovery (recovery, optional)
- Stationary Bike: Ten minutes of easy, conversational-pace cycling. (~10 min)

## Tuesday: Sample Recovery
A lighter second day, mostly to show a program can span more than one day.

### Mobility (mobility)
- Hip Flexor Stretch: A few minutes of easy hip and ankle mobility work. (~5 min)
  - 90/90 hip switches
  - Ankle circles

### Calisthenics (calisthenics)
- Dead Hang: 2 x 20-30s hold
`;

function prefixSampleId(template: WorkoutTemplate): WorkoutTemplate {
  return { ...template, id: `sample-${template.weekday}` };
}

function buildSampleProgram(): ResolvedProgram {
  const result = parseProgramText(SAMPLE_PROGRAM_SOURCE_TEXT);
  if (!result.program) {
    // The sample is authored content, not owner input — if it fails to
    // parse that is a bug in this file or the parser, not a recoverable
    // runtime condition. Fail loudly at build/dev time.
    throw new Error(`Sample program failed to parse:\n${result.errors.join('\n')}`);
  }
  if (result.warnings.length > 0) {
    throw new Error(`Sample program produced unexpected warnings:\n${result.warnings.join('\n')}`);
  }

  const templates = { ...result.program.templates };
  for (const weekday of Object.keys(templates) as (keyof typeof templates)[]) {
    templates[weekday] = prefixSampleId(templates[weekday]);
  }

  return { ...result.program, name: 'Sample Program', templates };
}

export const SAMPLE_PROGRAM: ResolvedProgram = buildSampleProgram();

/**
 * The sample exists to demonstrate every card type. "Try the sample
 * workout" always starts this day, regardless of the real weekday, so the
 * demo never dead-ends on one of the sample's rest days.
 */
export const SAMPLE_DEMO_WEEKDAY = 'monday' as const;
