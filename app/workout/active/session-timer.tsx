"use client";

import { useEffect, useState } from "react";

/** Formats whole seconds as H:MM:SS (or M:SS under an hour). */
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

/** Always computed from the device clock against `startedAt` — never a
 * stored running counter (CLAUDE.md: "Timer display is client-side ...
 * ticking every second; never store a running counter"), so it keeps
 * running correctly across a resumed session. */
export default function SessionTimer({ startedAt }: { startedAt: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const elapsedSeconds = (now - new Date(startedAt).getTime()) / 1000;

  return (
    <span className="font-display text-lg font-semibold tabular-nums text-ink-primary" aria-label="Session duration">
      {formatElapsed(elapsedSeconds)}
    </span>
  );
}
