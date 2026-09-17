"use client";

import { useEffect, useState } from "react";

/** Formats whole seconds as H:MM:SS (or M:SS under an hour). Same shape as
 * session-timer.tsx's formatter, duplicated rather than shared since it's a
 * single small pure function and the two timers have no other coupling. */
function formatElapsed(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

/** Small, unobtrusive time-on-this-exercise indicator (owner request: "I
 * want there to be a timer for how long I have been on an exercise. It
 * shouldn't be huge, but still exist." / "when I click off of an exercise
 * and come back, I want it to save the time I spent on it. Right now it
 * resets back to zero and starts counting again").
 *
 * `baseSeconds` is the time already banked for this slot from earlier
 * stints as the current exercise (lib/workout-session/slot-time.ts,
 * ExerciseSlotLog.activeSeconds); `sinceMs` is the wall-clock moment the
 * athlete most recently entered it (ExerciseSlotLog.enteredAt, parsed to
 * ms), or null while it isn't the current exercise. Both are read from the
 * session's own persisted state, not local component state, so leaving an
 * exercise and coming back — or refreshing mid-exercise — keeps counting
 * instead of resetting to zero. */
export default function ExerciseTimer({ baseSeconds, sinceMs }: { baseSeconds: number; sinceMs: number | null }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (sinceMs === null) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [sinceMs]);

  const liveSeconds = sinceMs !== null ? Math.max(0, (now - sinceMs) / 1000) : 0;
  const elapsedSeconds = baseSeconds + liveSeconds;

  return (
    <span
      className="font-display text-sm font-medium tabular-nums text-ink-tertiary"
      aria-label="Time on this exercise"
    >
      {formatElapsed(elapsedSeconds)}
    </span>
  );
}
