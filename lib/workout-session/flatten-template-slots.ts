/**
 * Flattens a TrainingDayTemplate's sections/exercises into the ordered,
 * linear list the active-workout screen steps through one card at a time
 * (PRODUCT_SPEC §6 "Linear execution flow"). Read-only: never mutates or
 * duplicates program content, only walks it.
 */

import type {
  PrescribedExercise,
  TrainingDayTemplate,
  WorkoutSection,
} from '@/lib/program/program-types';

export interface TemplateSlot {
  slotKey: string;
  section: WorkoutSection;
  exercise: PrescribedExercise;
}

/** Stable regardless of which "or" alternative gets chosen later. */
export function slotKeyFor(sectionId: string, exerciseOrder: number): string {
  return `${sectionId}:${exerciseOrder}`;
}

/** The slot immediately after `currentSlotKey` in the linear flow, or null
 * once the final slot has been passed (the completion screen shows). */
export function nextSlotKey(templateSlots: TemplateSlot[], currentSlotKey: string): string | null {
  const index = templateSlots.findIndex((slot) => slot.slotKey === currentSlotKey);
  if (index === -1 || index === templateSlots.length - 1) return null;
  return templateSlots[index + 1].slotKey;
}

export function flattenTemplateSlots(template: TrainingDayTemplate): TemplateSlot[] {
  const orderedSections = [...template.sections].sort((a, b) => a.order - b.order);

  return orderedSections.flatMap((section) => {
    const orderedExercises = [...section.exercises].sort((a, b) => a.order - b.order);
    return orderedExercises.map((exercise) => ({
      slotKey: slotKeyFor(section.id, exercise.order),
      section,
      exercise,
    }));
  });
}
