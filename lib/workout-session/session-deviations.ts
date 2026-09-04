/**
 * Pure detection of what makes a finished session "modified" rather than
 * "completed" (Phase 5, modify-don't-fail: PLAN.md, CLAUDE.md non-negotiable
 * 21). `modified` is a TERMINAL status assigned deterministically at Finish
 * (see workout-session-types.ts's WorkoutSessionStatus comment) — never
 * chosen mid-workout, never hidden: detectSessionDeviations is exactly what
 * the completion screen shows the athlete BEFORE they tap Finish
 * (CLAUDE.md non-negotiable 17, transparency).
 *
 * Deviations are derived from the slot logs plus the explicit
 * `performance.modifications` inputs every time this runs — never stored on
 * their own, so the label wording can evolve without a migration. Pure
 * function, no side effects, per CLAUDE.md's "shared logic is pure"
 * convention (mirrors completion-stats.ts).
 */

import type { TemplateSlot } from './flatten-template-slots';
import type { WorkoutSessionPerformance } from './workout-session-types';

export type SessionDeviationKind =
  | 'skipped-exercise'
  | 'not-done'
  | 'reduced-sets'
  | 'reduced-load'
  | 'substituted-exercise'
  | 'recovery-mode'
  | 'ended-early';

export interface SessionDeviation {
  kind: SessionDeviationKind;
  slotKey?: string;
  label: string;
}

/** Resolves a slot's display name from the session's own exercisesSnapshot
 * (never the current active program — a re-paste must never corrupt a
 * historical record). Falls back to the raw exercise id, then the slotKey
 * itself if the slot has no log at all (should not happen for a slot that
 * came from templateSlots). */
function resolveSlotName(performance: WorkoutSessionPerformance, slotKey: string): string {
  const slot = performance.slots[slotKey];
  const exerciseId = slot?.chosenExerciseId ?? slot?.prescribedExerciseId;
  if (!exerciseId) return slotKey;
  return performance.exercisesSnapshot[exerciseId]?.name ?? exerciseId;
}

export function detectSessionDeviations(
  performance: WorkoutSessionPerformance,
  templateSlots: TemplateSlot[]
): SessionDeviation[] {
  const deviations: SessionDeviation[] = [];
  const modifications = performance.modifications;

  if (modifications?.endedEarly) {
    // One folded deviation for everything the early stop left behind,
    // rather than a wall of individual "not done" entries. A skipped slot
    // that already has completed sets logged is informative on its own
    // (partial work then skipped), so it still gets its own entry in
    // addition to being counted in the aggregate.
    let notDoneCount = 0;
    for (const templateSlot of templateSlots) {
      if (templateSlot.section.optional) continue;
      const slotLog = performance.slots[templateSlot.slotKey];
      if (!slotLog) continue;
      if (slotLog.status !== 'skipped' && slotLog.status !== 'upcoming') continue;

      notDoneCount += 1;
      const hasWork = slotLog.sets.some((set) => set.completed) || Boolean(slotLog.qualitativeCompleted);
      if (slotLog.status === 'skipped' && hasWork) {
        deviations.push({
          kind: 'skipped-exercise',
          slotKey: templateSlot.slotKey,
          label: `Skipped: ${resolveSlotName(performance, templateSlot.slotKey)}`,
        });
      }
    }
    // 'unfinished' is never chosen by the athlete (see EndedEarlyReason) —
    // it means this session was auto-closed because it was left active from
    // an earlier day, so the folded label reads as a fact rather than a
    // choice the athlete made mid-workout.
    const label =
      modifications?.endedEarlyReason === 'unfinished'
        ? `Left unfinished, ${notDoneCount} exercise${notDoneCount === 1 ? '' : 's'} not done`
        : `Ended early, ${notDoneCount} exercise${notDoneCount === 1 ? '' : 's'} not done`;
    deviations.push({ kind: 'ended-early', label });
  } else {
    for (const templateSlot of templateSlots) {
      if (templateSlot.section.optional) continue;
      const slotLog = performance.slots[templateSlot.slotKey];
      if (!slotLog) continue;
      if (slotLog.status === 'skipped') {
        deviations.push({
          kind: 'skipped-exercise',
          slotKey: templateSlot.slotKey,
          label: `Skipped: ${resolveSlotName(performance, templateSlot.slotKey)}`,
        });
      } else if (slotLog.status === 'upcoming') {
        deviations.push({
          kind: 'not-done',
          slotKey: templateSlot.slotKey,
          label: `Not done: ${resolveSlotName(performance, templateSlot.slotKey)}`,
        });
      }
    }
  }

  for (const templateSlot of templateSlots) {
    // Optional sections are excluded here for the same reason their skips
    // are above: doing less of something the program itself marks optional
    // is not a deviation from the prescription.
    if (templateSlot.section.optional) continue;
    const slotLog = performance.slots[templateSlot.slotKey];
    if (!slotLog || slotLog.status !== 'completed') continue;
    const prescription = templateSlot.exercise.prescription;
    if (prescription.type === 'qualitative') continue;

    const prescribedSets = prescription.sets;
    const completedSets = slotLog.sets.filter((set) => set.completed).length;
    if (completedSets < prescribedSets) {
      deviations.push({
        kind: 'reduced-sets',
        slotKey: templateSlot.slotKey,
        label: `Fewer sets: ${resolveSlotName(performance, templateSlot.slotKey)}, ${completedSets} of ${prescribedSets}`,
      });
    }
  }

  for (const slotKey of modifications?.reducedLoadSlotKeys ?? []) {
    deviations.push({
      kind: 'reduced-load',
      slotKey,
      label: `Went lighter: ${resolveSlotName(performance, slotKey)}`,
    });
  }

  for (const substitution of modifications?.substitutions ?? []) {
    const fromName = performance.exercisesSnapshot[substitution.fromExerciseId]?.name ?? substitution.fromExerciseId;
    const toName = performance.exercisesSnapshot[substitution.toExerciseId]?.name ?? substitution.toExerciseId;
    deviations.push({
      kind: 'substituted-exercise',
      slotKey: substitution.slotKey,
      label: `Substituted ${toName} for ${fromName}`,
    });
  }

  if (modifications?.recoveryMode) {
    deviations.push({ kind: 'recovery-mode', label: 'Converted to a recovery session' });
  }

  return deviations;
}

export function resolveFinishStatus(deviations: SessionDeviation[]): 'completed' | 'modified' {
  return deviations.length > 0 ? 'modified' : 'completed';
}
