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
import { isResumableSession, isSampleSession } from './resumable-session';

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

/** Synchronous check used by the Today screen to decide between "Start
 * workout" and "Resume workout". Only a real program session that is
 * genuinely resumable counts — a sample session or an untouched leftover
 * from a previous day must never hold Today in "Resume" mode (see
 * resumable-session.ts). */
export function hasResumableLocalProgramSession(todaysDate: string): boolean {
  const record = loadLocalSession();
  return record !== null && !isSampleSession(record) && isResumableSession(record, todaysDate);
}
