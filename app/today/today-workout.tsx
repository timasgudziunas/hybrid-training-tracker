"use client";

import { useSyncExternalStore } from "react";
import type { Weekday } from "@/lib/program/program-types";
import { getWorkoutForWeekday } from "@/lib/program/weekly-program";
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

export default function TodayWorkout() {
  const weekday = useSyncExternalStore(subscribeToNothing, getClientWeekday, getServerWeekday);

  if (weekday === null) {
    return <div className="h-48 w-full animate-pulse rounded-lg bg-zinc-950" aria-hidden="true" />;
  }

  const template = getWorkoutForWeekday(weekday);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs uppercase tracking-widest text-zinc-500">{capitalizeLabel(weekday)}</p>
      {template.restDay ? <RestDayCard template={template} /> : <WorkoutCard template={template} />}
    </div>
  );
}
