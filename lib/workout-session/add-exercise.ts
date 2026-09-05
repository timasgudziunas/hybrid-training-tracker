/**
 * Adding an exercise to a session mid-workout from the library (R10, owner
 * request 2026-09-04). Pure: takes the session record and the catalog
 * exercise, returns the new record plus the new slot's key. The
 * active-workout screen persists the result through its save queue.
 *
 * How an added exercise lives in the session: the session already owns a
 * private copy of its day template (performance.templateSnapshot), so the
 * exercise is appended there as a PrescribedExercise inside a dedicated
 * "Added" section (id ADDED_SECTION_ID, marked optional). Everything
 * downstream (flattenTemplateSlots, history, stats, deviations) then sees
 * it like any other slot with zero special cases. The section being
 * optional means skipping an added exercise is never a deviation and the
 * session can still finish as Completed: doing extra is not failing the
 * plan. The slot key is also recorded in modifications.addedSlotKeys so
 * the completion screen can list what was added.
 *
 * The slot's prescription is the exercise's defaultPrescription, or
 * FALLBACK_PRESCRIPTION for a program-only exercise without one.
 */

import type { Exercise, Prescription, WorkoutSection } from '@/lib/program/program-types';
import { slotKeyFor } from './flatten-template-slots';
import type { ExerciseSlotLog, WorkoutSessionRecord } from './workout-session-types';

export const ADDED_SECTION_ID = 'added';
export const ADDED_SECTION_NAME = 'Added today';

export const FALLBACK_PRESCRIPTION: Prescription = { type: 'repetitions', sets: 3, minReps: 8, maxReps: 12 };

function addedSectionOf(record: WorkoutSessionRecord): WorkoutSection | undefined {
  return record.performance.templateSnapshot.sections.find((section) => section.id === ADDED_SECTION_ID);
}

export function addExerciseToSession(
  record: WorkoutSessionRecord,
  exercise: Exercise
): { record: WorkoutSessionRecord; slotKey: string } {
  const template = record.performance.templateSnapshot;
  const existing = addedSectionOf(record);
  const maxOrder = template.sections.reduce((max, section) => Math.max(max, section.order), 0);

  const section: WorkoutSection = existing ?? {
    id: ADDED_SECTION_ID,
    name: ADDED_SECTION_NAME,
    order: maxOrder + 1,
    type: 'strength',
    optional: true,
    exercises: [],
  };

  const order = section.exercises.reduce((max, entry) => Math.max(max, entry.order), 0) + 1;
  const prescription = exercise.defaultPrescription ?? FALLBACK_PRESCRIPTION;
  const nextSection: WorkoutSection = {
    ...section,
    exercises: [...section.exercises, { exerciseId: exercise.id, order, prescription }],
  };

  const sections = existing
    ? template.sections.map((entry) => (entry.id === ADDED_SECTION_ID ? nextSection : entry))
    : [...template.sections, nextSection];

  const slotKey = slotKeyFor(ADDED_SECTION_ID, order);
  const slotLog: ExerciseSlotLog = {
    slotKey,
    prescribedExerciseId: exercise.id,
    chosenExerciseId: exercise.id,
    status: 'upcoming',
    sets: [],
  };

  const addedSlotKeys = [...(record.performance.modifications?.addedSlotKeys ?? []), slotKey];

  return {
    slotKey,
    record: {
      ...record,
      performance: {
        ...record.performance,
        templateSnapshot: { ...template, sections },
        exercisesSnapshot: { ...record.performance.exercisesSnapshot, [exercise.id]: exercise },
        slots: { ...record.performance.slots, [slotKey]: slotLog },
        modifications: { ...record.performance.modifications, addedSlotKeys },
        currentSlotKey: slotKey,
      },
    },
  };
}
