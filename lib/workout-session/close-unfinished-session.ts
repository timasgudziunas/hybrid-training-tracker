/**
 * Closes a session that was left active on an earlier day so it can never
 * hijack a later day's Today screen (owner: "I don't want tomorrow's
 * session to change because I didn't finish exercises from the session
 * before" — see resumable-session.ts's isStaleUnfinishedSession, the caller
 * that decides WHEN this runs). Every not-yet-done slot is marked
 * 'skipped', the session is stamped 'unfinished' the same way an explicit
 * "End workout early" is, and the terminal status is resolved the exact
 * same deterministic way Finish would (always 'modified': a session that
 * had to be auto-closed always left something not done). `completedAt` and
 * `durationSeconds` stay null since we never actually observed when the
 * athlete stopped. Pure: takes a record in, returns a new record out; the
 * caller is responsible for persisting/syncing/stashing it.
 */

import { computeCompletionStats } from './completion-stats';
import type { TemplateSlot } from './flatten-template-slots';
import { detectSessionDeviations, resolveFinishStatus } from './session-deviations';
import type {
  ExerciseSlotLog,
  WorkoutSessionPerformance,
  WorkoutSessionRecord,
} from './workout-session-types';

export function closeUnfinishedSession(
  record: WorkoutSessionRecord,
  templateSlots: TemplateSlot[]
): WorkoutSessionRecord {
  const nextSlots: Record<string, ExerciseSlotLog> = {};
  for (const [slotKey, slot] of Object.entries(record.performance.slots)) {
    nextSlots[slotKey] = {
      ...slot,
      status: slot.status === 'upcoming' ? 'skipped' : slot.status,
      draft: undefined,
    };
  }

  const performance: WorkoutSessionPerformance = {
    ...record.performance,
    slots: nextSlots,
    currentSlotKey: null,
    modifications: {
      ...record.performance.modifications,
      endedEarly: true,
      endedEarlyReason: 'unfinished',
    },
  };

  const stats = computeCompletionStats(performance, templateSlots);
  const deviations = detectSessionDeviations(performance, templateSlots);

  return {
    ...record,
    status: resolveFinishStatus(deviations),
    completedAt: null,
    durationSeconds: null,
    performance: { ...performance, stats },
  };
}
