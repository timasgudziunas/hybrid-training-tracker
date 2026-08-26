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
  ultimatePracticeLater: boolean;
  /** The representative real (non-sample) session for this date, if any —
   * present regardless of `state` so the UI can still link to, say, a
   * "missed" day that actually has an unfinished (active/planned) row to
   * show as "left unfinished". Null when nothing was ever logged. */
  session: DaySessionRef | null;
  hasBodyCheckin: boolean;
}

const COMPLETE_STATUSES: ReadonlySet<WorkoutSessionStatus> = new Set(["completed", "modified"]);

export function classifyDay({
  date,
  today,
  weekday,
  program,
  session,
  hasBodyCheckin = false,
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
}): DayClassification {
  const isToday = date === today;
  const isFuture = compareDateStrings(date, today) > 0;

  const programCoversDate = program !== null && !isFuture && compareDateStrings(date, program.activeSinceDate) >= 0;
  const template = programCoversDate ? program!.templates[weekday] : null;
  const isTrainingDay = template !== null && !template.restDay;
  const ultimatePracticeLater = Boolean(template && !template.restDay && template.ultimatePracticeLater);

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

  return { date, weekday, isToday, state, ultimatePracticeLater, session, hasBodyCheckin };
}
