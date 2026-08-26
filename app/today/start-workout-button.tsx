"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { getLocalDateString } from "@/lib/date/local-date-string";
import { hasResumableLocalProgramSession } from "@/lib/workout-session/local-session-store";

function subscribeToNothing(): () => void {
  return () => {};
}

// Mirrors today-workout.tsx's server/client snapshot split: the server has
// no localStorage to read, so it renders nothing here; the client swaps in
// the real button immediately after hydration (no mismatch, no flash).
function getServerSnapshot(): null {
  return null;
}

function getClientSnapshot(): boolean {
  return hasResumableLocalProgramSession(getLocalDateString(new Date()));
}

export default function StartWorkoutButton() {
  const hasActiveSession = useSyncExternalStore(subscribeToNothing, getClientSnapshot, getServerSnapshot);

  if (hasActiveSession === null) {
    return <div className="h-16 w-full animate-pulse rounded-xl bg-surface-2" aria-hidden="true" />;
  }

  return (
    <Link
      href="/workout/active"
      className="flex h-16 w-full items-center justify-center rounded-xl bg-accent text-lg font-semibold text-accent-ink shadow-card transition-colors active:bg-accent-strong"
    >
      {hasActiveSession ? "Resume workout" : "Start workout"}
    </Link>
  );
}
