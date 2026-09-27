/**
 * Classifies a single calendar day into the state the History calendar
 * renders (PRODUCT_SPEC §15, CLAUDE.md non-negotiable 21: modified is
 * distinct from both completed and missed). Pure function: program data and
 * a resolved session reference in, one classification out.
 */

import type { Weekday, WorkoutTemplate } from "@/lib/program/program-types";
import type { WorkoutSessionStatus } from "@/lib/workout-session/workout-session-types";
import { compareDateStrings } from "./calendar-grid";

export type DayState =
  | "completed"
  | "modified"
  /** A scheduled past training day with no completed/modified session. */
  | "missed"
  /** The active program's rest day for this weekday. */
  | "rest"
  /** Today, a training day, not yet completed — distinct from "missed"
   * because the day isn't over. */
  | "scheduled"
  /** No active program covered this date at all (never activated, or
   * activated only after this date) — we genuinely don't know what, if
   * anything, was prescribed. */
  | "unscheduled"
  | "future";

export interface DaySessionRef {
  id: string;
  status: WorkoutSessionStatus;
  /** Date the session was actually performed ("yyyy-mm-dd"). Only differs
   * from the date being classified for a make-up session. */
  sessionDate?: string;
  /** The missed training day this session makes up for, if any. Callers
   * key sessions by effective date (lib/history/session-filtering.ts), so
   * a ref with this set is always found under the missed date. */
  makeUpForDate?: string | null;
}

export interface ActiveProgramWeek {
  templates: Record<Weekday, WorkoutTemplate>;
  /** Device-local calendar date the active program was saved, "yyyy-mm-dd".
   * Days before this are "unscheduled" rather than guessed at. */
  activeSinceDate: string;
}

export interface DayClassification {
  date: string;
  weekday: Weekday;
  isToday: boolean;
  state: DayState;
  /** Whether Ultimate practice was explicitly checked as attended in-app
   * that day (app/today/ultimate-practice-actions.ts) — never inferred from
   * the program's `ultimatePracticeLater` schedule flag, since a scheduled
   * practice can be missed, cancelled, or rescheduled. */
  hasUltimatePractice: boolean;
  /** The representative real (non-sample) session for this date, if any —
   * present regardless of `state` so the UI can still link to, say, a
   * "missed" day that actually has an unfinished (active/planned) row to
   * show as "left unfinished". Null when nothing was ever logged. */
  session: DaySessionRef | null;
  hasBodyCheckin: boolean;
  /** When this training day was made up on a later date (owner decision
   * 2026-09-27, make-up sessions): the "yyyy-mm-dd" it was actually
   * performed. `state` is still completed/modified; this only changes how
   * the day is labelled and where its drill-down lives. Null otherwise. */
  madeUpOn: string | null;
}

const COMPLETE_STATUSES: ReadonlySet<WorkoutSessionStatus> = new Set(["completed", "modified"]);

export function classifyDay({
  date,
  today,
  weekday,
  program,
  session,
  hasBodyCheckin = false,
  hasUltimatePractice = false,
}: {
  /** yyyy-mm-dd, device-local. */
  date: string;
  /** yyyy-mm-dd, device-local "today" — always resolved client-side by the
   * caller (see history-calendar-client.tsx), never guessed on the server. */
  today: string;
  weekday: Weekday;
  program: ActiveProgramWeek | null;
  session: DaySessionRef | null;
  hasBodyCheckin?: boolean;
  /** Explicit attendance for this date, from the caller's own lookup against
   * ultimate_practice_days — this function never derives it from the
   * program's schedule flag. */
  hasUltimatePractice?: boolean;
}): DayClassification {
  const isToday = date === today;
  const isFuture = compareDateStrings(date, today) > 0;

  const programCoversDate = program !== null && !isFuture && compareDateStrings(date, program.activeSinceDate) >= 0;
  const template = programCoversDate ? program!.templates[weekday] : null;
  const isTrainingDay = template !== null && !template.restDay;

  let state: DayState;

  if (isFuture) {
    state = "future";
  } else if (session && COMPLETE_STATUSES.has(session.status)) {
    state = session.status === "modified" ? "modified" : "completed";
  } else if (!programCoversDate) {
    state = "unscheduled";
  } else if (!isTrainingDay) {
    state = "rest";
  } else if (isToday) {
    state = "scheduled";
  } else {
    state = "missed";
  }

  const madeUpOn =
    session && session.makeUpForDate && session.sessionDate && session.sessionDate !== date ? session.sessionDate : null;

  return { date, weekday, isToday, state, hasUltimatePractice, session, hasBodyCheckin, madeUpOn };
}
