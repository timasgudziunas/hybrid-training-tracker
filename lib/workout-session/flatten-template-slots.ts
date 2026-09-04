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
import type { ExerciseSlotLog } from '@/lib/workout-session/workout-session-types';

export interface TemplateSlot {
  slotKey: string;
  section: WorkoutSection;
  exercise: PrescribedExercise;
}

/** Stable regardless of which "or" alternative gets chosen later. */
export function slotKeyFor(sectionId: string, exerciseOrder: number): string {
  return `${sectionId}:${exerciseOrder}`;
}

/**
 * Where "Next"/skip should land after `fromSlotKey` (owner: "if I finish an
 * exercise that isn't next up and click next, it should skip the one I
 * already finished" / "after the last exercise it should go to the overview,
 * not straight to Finish"). A slot with no log at all counts as 'upcoming'
 * (matches create-session.ts: every slot always starts upcoming, so a
 * missing entry only happens for a template slot the session hasn't caught
 * up to structurally, which should still be treated as not-done).
 *
 * `next` is the first slot AFTER `fromSlotKey` in template order that is
 * still upcoming (a skipped slot is deliberately stepped over: the athlete
 * chose to leave it). `remainingElsewhere` is every OTHER not-done slot in
 * template order (before `fromSlotKey`, and after it excluding `next`),
 * never including `fromSlotKey` itself. "Not done" there is wider than
 * "upcoming": it also includes a skipped slot with nothing logged (see
 * isSlotNotDone), because the whole point of landing on the overview after
 * the last exercise is to offer a way back to something "busy or skipped"
 * (owner's words) before finishing.
 */
export function isSlotNotDone(slotLog: ExerciseSlotLog | undefined): boolean {
  if (!slotLog) return true;
  if (slotLog.status === 'upcoming') return true;
  if (slotLog.status !== 'skipped') return false;
  const hasWork = slotLog.sets.some((set) => set.completed) || Boolean(slotLog.qualitativeCompleted);
  return !hasWork;
}

export function nextUnfinishedSlotKey(
  templateSlots: TemplateSlot[],
  slotLogs: Record<string, ExerciseSlotLog>,
  fromSlotKey: string
): { next: string | null; remainingElsewhere: string[] } {
  const fromIndex = templateSlots.findIndex((slot) => slot.slotKey === fromSlotKey);
  const isUpcoming = (slotKey: string) => (slotLogs[slotKey]?.status ?? 'upcoming') === 'upcoming';

  let next: string | null = null;
  const remainingElsewhere: string[] = [];

  templateSlots.forEach((slot, index) => {
    if (slot.slotKey === fromSlotKey) return;
    if (fromIndex !== -1 && index > fromIndex && next === null && isUpcoming(slot.slotKey)) {
      next = slot.slotKey;
      return;
    }
    if (isSlotNotDone(slotLogs[slot.slotKey])) remainingElsewhere.push(slot.slotKey);
  });

  return { next, remainingElsewhere };
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
