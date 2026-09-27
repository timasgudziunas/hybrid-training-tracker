"use client";

import { useSyncExternalStore } from "react";
import type { ResolvedProgram, Weekday } from "@/lib/program/program-types";
import { getWorkoutForWeekday } from "@/lib/program/resolved-program";
import { getLocalDateString } from "@/lib/date/local-date-string";
import { weekdayOfDateString } from "@/lib/history/calendar-grid";
import { groupSessionsByDate } from "@/lib/history/session-filtering";
import { findMakeUpCandidates } from "@/lib/workout-session/make-up-candidates";
import type { SessionSummary } from "@/app/history/actions";
import { capitalizeLabel } from "./capitalize-label";
import WorkoutCard from "./workout-card";
import RestDayCard from "./rest-day-card";
import MakeUpOffer from "./make-up-offer";
import UltimatePracticeCheckbox from "./ultimate-practice-checkbox";

// There's nothing external to subscribe to: the device-local date only
// needs to be read once per mount (a new calendar day requires a fresh page
// load anyway to see it), so this store has no update source.
function subscribeToNothing(): () => void {
  return () => {};
}

function getClientToday(): string {
  return getLocalDateString(new Date());
}

// The server renders in UTC, which can disagree with the athlete's local
// calendar date, so it must never guess today's date. Returning null here
// matches the client's first hydration render exactly (no mismatch and no
// wrong-day flash); useSyncExternalStore then swaps in the real
// device-local date immediately after hydration.
function getServerToday(): null {
  return null;
}

export default function TodayWorkoutClient({
  program,
  sessions,
  activeSinceDate,
}: {
  program: ResolvedProgram;
  /** Recent session summaries (today-workout.tsx), used to compute make-up
   * offers (owner decision 2026-09-27). */
  sessions: SessionSummary[];
  /** The active program's activeSinceDate (see lib/history/active-since-date.ts),
   * so a day before the program existed is never offered as a make-up. */
  activeSinceDate: string;
}) {
  const today = useSyncExternalStore(subscribeToNothing, getClientToday, getServerToday);

  if (today === null) {
    return <div className="h-48 w-full animate-pulse rounded-2xl bg-surface-1" aria-hidden="true" />;
  }

  const weekday: Weekday = weekdayOfDateString(today);
  const template = getWorkoutForWeekday(program, weekday);
  const sessionByDate = groupSessionsByDate(sessions);
  const candidates = findMakeUpCandidates({
    today,
    program: { templates: program.templates, activeSinceDate },
    sessionByDate,
  });

  return (
    <div className="flex flex-col gap-4">
      <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-ink-tertiary">
        {capitalizeLabel(weekday)}
      </p>
      {template.restDay ? (
        <RestDayCard template={template} makeUps={candidates} />
      ) : (
        <>
          <WorkoutCard template={template} exercises={program.exercises} />
          <MakeUpOffer candidates={candidates} />
          <UltimatePracticeCheckbox scheduled={template.ultimatePracticeLater} />
        </>
      )}
    </div>
  );
}
