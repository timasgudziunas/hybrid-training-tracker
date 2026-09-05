/**
 * localStorage stash for finished-but-unsynced sessions (CLAUDE.md
 * non-negotiable 22, save-queue follow-on: a finished workout must never be
 * lost). local-session-store.ts holds exactly one "current active session"
 * mirror, which gets overwritten the moment a new session starts or resumes.
 * If a completed session's final save never landed by then, overwriting the
 * mirror would silently drop the only surviving copy — so it gets stashed
 * here first, keyed by array + dedupe-by-id, and only removed once a later
 * sync attempt actually confirms the server has it.
 */

import type { WorkoutSessionRecord } from './workout-session-types';

const PENDING_SYNC_KEY = 'htt-pending-sync-sessions';

export function loadPendingSessions(): WorkoutSessionRecord[] {
  try {
    const raw = window.localStorage.getItem(PENDING_SYNC_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as WorkoutSessionRecord[]) : [];
  } catch {
    return [];
  }
}

/** Appends `record`, deduping by id and keeping the newest copy when a
 * session is stashed more than once. Best effort only. */
export function stashPendingSession(record: WorkoutSessionRecord): void {
  try {
    const existing = loadPendingSessions().filter((session) => session.id !== record.id);
    existing.push(record);
    window.localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(existing));
  } catch {
    // Best effort only. Worst case this one session isn't stashed and the
    // active-session mirror (its other copy, until overwritten) is relied on
    // instead.
  }
}

export function removePendingSession(id: string): void {
  try {
    const remaining = loadPendingSessions().filter((session) => session.id !== id);
    window.localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(remaining));
  } catch {
    // Nothing to do; worst case a synced session lingers in the stash and
    // gets retried (harmlessly, saveWorkoutSession is an idempotent upsert).
  }
}

/** Drops every stashed session. Only for an account change on this browser
 * (sign-in / sign-out): a stash left by another athlete must never be
 * retried under the next account. */
export function clearPendingSessions(): void {
  try {
    window.localStorage.removeItem(PENDING_SYNC_KEY);
  } catch {
    // Nothing to do.
  }
}
