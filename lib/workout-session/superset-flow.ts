/**
 * Superset execution (owner's definition, 2026-09-17): two or more exercises
 * performed back to back with little or no rest between them, one set of
 * the first straight into one set of the second (and so on through the
 * group), resting only after every member has been hit for that round, then
 * repeating for every set. The parser (lib/program/parse-program-text.ts) is
 * the only place PrescribedExercise.supersetGroup ever gets set: it
 * guarantees group members are contiguous within a section and that a group
 * has at least two members. Set counts may still differ across members, in
 * which case the exercise with fewer sets simply finishes early and stops
 * needing work.
 *
 * Pure: no React, no side effects. The active-workout screen wires this
 * directly into handleLogSet rather than any of this logic living in a
 * component.
 */

import type { TemplateSlot } from './flatten-template-slots';
import type { ExerciseSlotLog } from './workout-session-types';
import { targetSetCount } from './slot-set-edits';

/** Every slot in `slotKey`'s own section sharing its (non-empty)
 * supersetGroup token, in template order. Empty when `slotKey` isn't found
 * or isn't in a superset. Scoped by `section.id` (never object identity) so
 * two different sections can reuse the same token without colliding. */
export function supersetMembers(templateSlots: TemplateSlot[], slotKey: string): TemplateSlot[] {
  const target = templateSlots.find((slot) => slot.slotKey === slotKey);
  const group = target?.exercise.supersetGroup;
  if (!target || !group) return [];
  return templateSlots.filter(
    (slot) => slot.section.id === target.section.id && slot.exercise.supersetGroup === group
  );
}

/** Whether a slot still has work left. A qualitative prescription never
 * needs work here (no per-set concept; QualitativeEntryCard owns its own
 * mark-complete flow); a slot already completed or skipped never needs
 * work; otherwise it needs work whenever fewer sets are logged than its
 * target (slot-set-edits.ts's targetSetCount, so a "+ Add set"/"Remove this
 * set" adjustment is honored). A missing log counts as needing work, and an
 * undecided "or" choice (no chosenExerciseId) still needs work: this never
 * looks at chosenExerciseId at all. */
export function slotNeedsWork(templateSlot: TemplateSlot, slotLog: ExerciseSlotLog | undefined): boolean {
  const prescription = templateSlot.exercise.prescription;
  if (prescription.type === 'qualitative') return false;

  const status = slotLog?.status ?? 'upcoming';
  if (status === 'completed' || status === 'skipped') return false;

  const effectiveSlot: ExerciseSlotLog =
    slotLog ?? {
      slotKey: templateSlot.slotKey,
      prescribedExerciseId: templateSlot.exercise.exerciseId,
      status: 'upcoming',
      sets: [],
    };
  return effectiveSlot.sets.length < targetSetCount(prescription.sets, effectiveSlot);
}

/**
 * After a set is logged on `fromSlotKey`, the next superset partner to move
 * to: the next member AFTER it in group order, wrapping back to the start
 * of the group, that still needs work. Never returns `fromSlotKey` itself.
 * Null when `fromSlotKey` isn't in a superset, or when no partner needs
 * work — the athlete stays right where they are.
 */
export function nextSupersetSlotKey(
  templateSlots: TemplateSlot[],
  slotLogs: Record<string, ExerciseSlotLog>,
  fromSlotKey: string
): string | null {
  const members = supersetMembers(templateSlots, fromSlotKey);
  if (members.length === 0) return null;

  const fromIndex = members.findIndex((member) => member.slotKey === fromSlotKey);
  if (fromIndex === -1) return null;

  for (let offset = 1; offset <= members.length; offset += 1) {
    const candidate = members[(fromIndex + offset) % members.length];
    if (candidate.slotKey === fromSlotKey) continue;
    if (slotNeedsWork(candidate, slotLogs[candidate.slotKey])) return candidate.slotKey;
  }
  return null;
}
