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
 * shouldn't be huge, but still exist."). `sinceMs` is not persisted —
 * active-workout-screen resets it whenever the current slot changes, and a
 * refresh or a jump via Overview simply restarts the count, which is fine
 * for a glance-only indicator. */
export default function ExerciseTimer({ sinceMs }: { sinceMs: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const elapsedSeconds = (now - sinceMs) / 1000;

  return (
    <span
      className="font-display text-sm font-medium tabular-nums text-ink-tertiary"
      aria-label="Time on this exercise"
    >
      {formatElapsed(elapsedSeconds)}
    </span>
  );
}
