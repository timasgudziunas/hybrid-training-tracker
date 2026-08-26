/**
 * Small helpers over a ResolvedProgram (CLAUDE.md non-negotiable 16). There
 * is no more a single code-seeded WEEKLY_PROGRAM constant: the program in
 * effect is either the owner's active pasted program (app/program/actions.ts
 * fetchActiveProgram) or, when none is active yet, the built-in sample
 * (lib/program/sample-program.ts). Both are ResolvedProgram values, so
 * everything downstream (Today screen, active workout) reads through these
 * helpers rather than importing program content directly.
 */

import type { TrainingDayTemplate, ResolvedProgram, WorkoutTemplate, Weekday } from './program-types';

export function getWorkoutForWeekday(program: ResolvedProgram, weekday: Weekday): WorkoutTemplate {
  return program.templates[weekday];
}

/** Every exerciseId (primary + alternatives) referenced anywhere in a
 * TrainingDayTemplate, in section/exercise order, de-duplicated. */
export function collectExerciseIdsForTemplate(template: TrainingDayTemplate): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  const orderedSections = [...template.sections].sort((a, b) => a.order - b.order);
  for (const section of orderedSections) {
    const orderedExercises = [...section.exercises].sort((a, b) => a.order - b.order);
    for (const exercise of orderedExercises) {
      for (const id of [exercise.exerciseId, ...(exercise.alternativeExerciseIds ?? [])]) {
        if (!seen.has(id)) {
          seen.add(id);
          ids.push(id);
        }
      }
    }
  }
  return ids;
}

/** Builds the minimal exercises map a session needs to snapshot for a given
 * day template: only the entries actually referenced by it. */
export function exercisesForTemplate(
  program: ResolvedProgram,
  template: TrainingDayTemplate
): Record<string, ResolvedProgram['exercises'][string]> {
  const subset: Record<string, ResolvedProgram['exercises'][string]> = {};
  for (const id of collectExerciseIdsForTemplate(template)) {
    const exercise = program.exercises[id];
    if (exercise) {
      subset[id] = exercise;
    }
  }
  return subset;
}
