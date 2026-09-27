/**
 * Shared session-selection rules for the History feature: which sessions
 * are "real" history, and which one row represents a given calendar date
 * when more than one exists.
 */

import type { WorkoutSessionStatus } from "@/lib/workout-session/workout-session-types";

/**
 * The built-in sample workout (lib/program/sample-program.ts) always ids its
 * templates `sample-<weekday>`, and any session started against it inherits
 * that as its `workoutTemplateId`. Sample runs are practice/demo, never real
 * training history, so they are always excluded from adherence and from the
 * calendar's real day states (PLAN.md R4).
 */
export function isSampleSession(workoutTemplateId: string): boolean {
  return workoutTemplateId.startsWith("sample-");
}

export interface SessionLike {
  id: string;
  sessionDate: string;
  workoutTemplateId: string;
  status: WorkoutSessionStatus;
  startedAt: string;
  /** The missed training day this session makes up for, if any (see
   * WorkoutSessionPerformance.makeUpForDate). */
  makeUpForDate?: string | null;
}

/**
 * The calendar date a session is credited to: the missed day it makes up
 * for when it is a make-up session, otherwise the date it was performed.
 * Every per-date view (calendar, adherence, make-up candidates) keys on
 * this, so a made-up Friday reads as done on Friday, and the Saturday it
 * was performed on stays whatever the program says Saturday is.
 */
export function effectiveSessionDate(session: Pick<SessionLike, "sessionDate" | "makeUpForDate">): string {
  return session.makeUpForDate ?? session.sessionDate;
}

/** Completed/modified rows are the most meaningful representative for a
 * date; missed is a deliberate record; active/planned are still open. Ties
 * within a status are broken by most-recently-started. */
const STATUS_PRIORITY: Record<WorkoutSessionStatus, number> = {
  completed: 0,
  modified: 1,
  missed: 2,
  active: 3,
  planned: 4,
};

function pickRepresentative<T extends SessionLike>(sessions: T[]): T {
  return sessions.slice().sort((a, b) => {
    const byStatus = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
    if (byStatus !== 0) return byStatus;
    return b.startedAt.localeCompare(a.startedAt);
  })[0];
}

/**
 * Groups sessions by EFFECTIVE calendar date (see effectiveSessionDate),
 * excluding sample-workout rows entirely, and reduces to a single
 * representative row per date (CLAUDE.md edge case: duplicate workout on
 * the same day — the calendar shows one state per day, not one per row).
 */
export function groupSessionsByDate<T extends SessionLike>(sessions: T[]): Map<string, T> {
  const byDate = new Map<string, T[]>();
  for (const session of sessions) {
    if (isSampleSession(session.workoutTemplateId)) continue;
    const date = effectiveSessionDate(session);
    const existing = byDate.get(date);
    if (existing) {
      existing.push(session);
    } else {
      byDate.set(date, [session]);
    }
  }

  const result = new Map<string, T>();
  for (const [date, sessionsForDate] of byDate) {
    result.set(date, pickRepresentative(sessionsForDate));
  }
  return result;
}
