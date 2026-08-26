"use client";

import { useSyncExternalStore } from "react";
import type { ResolvedProgram, Weekday } from "@/lib/program/program-types";
import { getWorkoutForWeekday } from "@/lib/program/resolved-program";
import { getLocalWeekday } from "@/lib/date/weekday-from-date";
import { capitalizeLabel } from "./capitalize-label";
import WorkoutCard from "./workout-card";
import RestDayCard from "./rest-day-card";

// There's nothing external to subscribe to: the device-local weekday only
// needs to be read once per mount (a new calendar day requires a fresh page
// load anyway to see it), so this store has no update source.
function subscribeToNothing(): () => void {
  return () => {};
}

function getClientWeekday(): Weekday {
  return getLocalWeekday(new Date());
}

// The server renders in UTC, which can disagree with the athlete's local
// calendar date, so it must never guess a weekday. Returning null here
// matches the client's first hydration render exactly (no mismatch and no
// wrong-day flash); useSyncExternalStore then swaps in the real
// device-local weekday immediately after hydration.
function getServerWeekday(): null {
  return null;
}

export default function TodayWorkoutClient({ program }: { program: ResolvedProgram }) {
  const weekday = useSyncExternalStore(subscribeToNothing, getClientWeekday, getServerWeekday);

  if (weekday === null) {
    return <div className="h-48 w-full animate-pulse rounded-2xl bg-surface-1" aria-hidden="true" />;
  }

  const template = getWorkoutForWeekday(program, weekday);

  return (
    <div className="flex flex-col gap-4">
      <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-ink-tertiary">
        {capitalizeLabel(weekday)}
      </p>
      {template.restDay ? (
        <RestDayCard template={template} />
      ) : (
        <WorkoutCard template={template} exercises={program.exercises} />
      )}
    </div>
  );
}
