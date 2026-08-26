"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { hasActiveLocalSession } from "@/lib/workout-session/local-session-store";

function subscribeToNothing(): () => void {
  return () => {};
}

// Mirrors today-workout.tsx's server/client snapshot split: the server has
// no localStorage to read, so it renders nothing here; the client swaps in
// the real button immediately after hydration (no mismatch, no flash).
function getServerSnapshot(): null {
  return null;
}

export default function StartWorkoutButton() {
  const hasActiveSession = useSyncExternalStore(subscribeToNothing, hasActiveLocalSession, getServerSnapshot);

  if (hasActiveSession === null) {
    return <div className="h-14 w-full animate-pulse rounded-md bg-zinc-950" aria-hidden="true" />;
  }

  return (
    <Link
      href="/workout/active"
      className="flex h-14 w-full items-center justify-center rounded-md bg-white text-base font-semibold text-black active:bg-zinc-300"
    >
      {hasActiveSession ? "Resume workout" : "Start Workout"}
    </Link>
  );
}
