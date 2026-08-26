import { fetchActiveProgram } from "@/app/program/actions";
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
 */
export default async function TodayWorkout() {
  const result = await fetchActiveProgram();
  const activeProgram = result.ok ? result.data : null;

  if (!activeProgram) {
    return <WaitingForProgram />;
  }

  return <TodayWorkoutClient program={activeProgram.parsed} />;
}
