/**
 * localStorage mirror of the active workout session (CLAUDE.md
 * non-negotiable 22: a refresh or accidental close must never lose data).
 * Written synchronously on every mutation, independent of whether the
 * debounced Supabase upsert has landed. Only one workout can be active at a
 * time, so a single unscoped key is enough — including across a midnight
 * rollover mid-session (a completed-after-midnight session keeps resuming
 * from wherever it started).
 */

import type { WorkoutSessionRecord } from './workout-session-types';

const ACTIVE_SESSION_KEY = 'htt-active-workout-session';

export function saveLocalSession(record: WorkoutSessionRecord): void {
  try {
    window.localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(record));
  } catch {
    // Best effort only. The debounced server upsert is the other half of
    // the dual-write; losing the local mirror on a single write is not
    // fatal, but there's nothing more to do here.
  }
}

export function loadLocalSession(): WorkoutSessionRecord | null {
  try {
    const raw = window.localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WorkoutSessionRecord;
  } catch {
    return null;
  }
}

export function clearLocalSession(): void {
  try {
    window.localStorage.removeItem(ACTIVE_SESSION_KEY);
  } catch {
    // Nothing to do; worst case a completed session lingers locally.
  }
}

/** Synchronous, cheap existence check used by the Today screen to decide
 * between "Start Workout" and "Resume workout" without loading the whole
 * record. */
export function hasActiveLocalSession(): boolean {
  const record = loadLocalSession();
  return record !== null && (record.status === 'active' || record.status === 'modified');
}
