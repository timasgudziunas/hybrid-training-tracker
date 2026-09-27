import { fetchActiveProgram } from "@/app/program/actions";
import { fetchSessionSummaries } from "@/app/history/actions";
import { activeSinceDateFromCreatedAt } from "@/lib/history/active-since-date";
import { addDays } from "@/lib/history/calendar-grid";
import { MAKE_UP_WINDOW_DAYS } from "@/lib/workout-session/make-up-candidates";
import TodayWorkoutClient from "./today-workout-client";
import WaitingForProgram from "./waiting-for-program";

/**
 * Server-fetches the active program (2026-08-25 rework, non-negotiable 16:
 * the program is the active pasted program in `training_programs`, nothing
 * hardcoded). When there is no active program yet — never pasted, or the
 * table itself doesn't exist — the Today screen shows a clean
 * waiting-for-program state instead of guessing at a workout. Weekday
 * resolution stays client-side (see TodayWorkoutClient): the server renders
 * in UTC, which can disagree with the athlete's local calendar date.
 *
 * Also fetches recent session summaries so the client can offer make-up
 * sessions for a training day missed within the last MAKE_UP_WINDOW_DAYS
 * (owner decision 2026-09-27). `startDate` is computed from the server's own
 * UTC date, one day wider than the window to cover the gap between server
 * and device timezones; the client applies the precise device-local window
 * on top of this. A session-fetch failure never blocks Today: it just means
 * no make-up offers render.
 */
export default async function TodayWorkout() {
  const serverToday = new Date().toISOString().slice(0, 10);
  const startDate = addDays(serverToday, -(MAKE_UP_WINDOW_DAYS + 1));

  const [programResult, sessionsResult] = await Promise.all([
    fetchActiveProgram(),
    fetchSessionSummaries(startDate),
  ]);
  const activeProgram = programResult.ok ? programResult.data : null;

  if (!activeProgram) {
    return <WaitingForProgram />;
  }

  return (
    <TodayWorkoutClient
      program={activeProgram.parsed}
      sessions={sessionsResult.ok ? sessionsResult.data : []}
      activeSinceDate={activeSinceDateFromCreatedAt(activeProgram.createdAt)}
    />
  );
}
