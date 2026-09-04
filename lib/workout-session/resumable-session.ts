/**
 * Pure rules for whether a stored session should be resumed or discarded.
 *
 * Opening /workout/active creates a session record immediately (so autosave
 * has something to write), which means backing out without logging anything
 * leaves an 'active' record behind. Without these rules that leftover makes
 * the Today screen say "Resume workout" forever — even for the sample
 * workout, or for an untouched session from a previous day.
 *
 * The rules are deliberately conservative about data: any session with real
 * logged work is always resumable (CLAUDE.md non-negotiable 22, including
 * across a midnight rollover). Only sessions with NOTHING logged can be
 * discarded, and sample sessions never count as the athlete's own workout.
 */

import type { WorkoutSessionRecord } from './workout-session-types';

/** A workout that started late and crosses midnight is still resumed within
 * this window; beyond it, an active session left over from a previous day
 * is stale and must never hijack the next day's Today screen (owner: "I
 * don't want tomorrow's session to change because I didn't finish exercises
 * from the session before"). Config, not a magic number scattered inline. */
export const RESUME_ACROSS_MIDNIGHT_HOURS = 6;

/** Sample-program sessions are demos: excluded from adherence, history, and
 * reviews, and they must never hold the Today screen in "Resume" mode. */
export function isSampleSession(record: WorkoutSessionRecord): boolean {
  return record.workoutTemplateId.startsWith('sample-');
}

/** True if the athlete has logged anything at all: advanced a slot, logged
 * or added a set, picked up a qualitative item, or written a note. A
 * brand-new session from create-session.ts always returns false. */
export function sessionHasLoggedWork(record: WorkoutSessionRecord): boolean {
  const performance = record.performance;
  if (performance.sessionNote || performance.sessionDifficulty !== undefined) return true;
  for (const slot of Object.values(performance.slots ?? {})) {
    if (slot.status !== 'upcoming') return true;
    if (slot.sets.length > 0) return true;
    if (slot.qualitativeCompleted) return true;
    if (slot.extraSets) return true;
    if (slot.note) return true;
  }
  return false;
}

/**
 * A session is resumable when it is still in flight (active) and either
 * belongs to today, or contains logged work AND was started recently enough
 * to still plausibly be "tonight's" workout (within RESUME_ACROSS_MIDNIGHT_
 * HOURS of `nowMs`). An untouched session from a previous calendar day is
 * always stale: discarding it loses nothing, and resuming it would silently
 * give the athlete the wrong day's workout. A session with real logged work
 * from too long ago is ALSO stale (2026-09-04 fix): without the time bound,
 * an unfinished session from days ago could resurface and hijack a later
 * day's Today screen forever.
 *
 * 'modified' is EXCLUDED here (Phase 5 decision, 2026-08-26): it is now a
 * TERMINAL status assigned deterministically at Finish (see
 * session-deviations.ts's resolveFinishStatus), the same moment 'completed'
 * is assigned — a session is never "modified" mid-workout, only after it. A
 * modified record lingering locally is therefore a finished-but-possibly-
 * unsynced session, handled the same way a completed one is (retry the
 * sync, stash to pending-sync if that fails), never resumed.
 */
export function isResumableSession(record: WorkoutSessionRecord, todaysDate: string, nowMs: number): boolean {
  if (record.status !== 'active') return false;
  if (record.sessionDate === todaysDate) return true;
  if (!sessionHasLoggedWork(record)) return false;
  return nowMs - Date.parse(record.startedAt) <= RESUME_ACROSS_MIDNIGHT_HOURS * 3600_000;
}

/**
 * True for an active session that has real logged work but is no longer
 * resumable (see isResumableSession above) — a workout the athlete left
 * mid-flight on some earlier day and never finished. The active-workout
 * screen closes these automatically via closeUnfinishedSession.ts so they
 * can never hijack a later day's session instead of quietly being lost.
 */
export function isStaleUnfinishedSession(record: WorkoutSessionRecord, todaysDate: string, nowMs: number): boolean {
  if (record.status !== 'active') return false;
  if (!sessionHasLoggedWork(record)) return false;
  return !isResumableSession(record, todaysDate, nowMs);
}
