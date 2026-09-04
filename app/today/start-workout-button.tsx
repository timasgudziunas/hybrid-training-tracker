"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { getLocalDateString } from "@/lib/date/local-date-string";
import { hasResumableLocalProgramSession, loadLocalSession } from "@/lib/workout-session/local-session-store";
import { loadPendingSessions } from "@/lib/workout-session/pending-sync-store";
import type { WorkoutSessionStatus } from "@/lib/workout-session/workout-session-types";
import { fetchLatestSessionSummaryForDate } from "@/app/workout/actions";

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
  // Date.now() here (via `new Date()`) is fine even though this runs during
  // render: useSyncExternalStore's getSnapshot contract requires a
  // synchronous read, and a resumability check that's off by the render's
  // own timing is harmless — it only ever affects the multi-hour midnight
  // rollover window, not this render's snapshot value.
  const now = new Date();
  return hasResumableLocalProgramSession(getLocalDateString(now), now.getTime());
}

/** Whether today's completed session is confirmed synced (server fetch) or
 * only known locally so far (local mirror still holding it, or stashed to
 * the pending-sync store after a failed save) — decides whether "View
 * session" or the sync-pending line renders. */
interface CompletedToday {
  durationSeconds: number | null;
  synced: boolean;
  /** 'completed' or 'modified' (both terminal, "finished" statuses since
   * the Phase 5 rework) — decides between "Completed today" and "Modified
   * session today". */
  status: WorkoutSessionStatus;
}

function formatMinutes(durationSeconds: number): string {
  return `${Math.round(durationSeconds / 60)} min`;
}

export default function StartWorkoutButton() {
  const hasActiveSession = useSyncExternalStore(subscribeToNothing, getClientSnapshot, getServerSnapshot);
  const [today] = useState(() => getLocalDateString(new Date()));
  const [completed, setCompleted] = useState<CompletedToday | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      // Server confirmation wins: a completed local mirror can linger even
      // after its save landed (post-Finish note edits recreate it, and only
      // the active-workout screen ever clears it), so checking local-first
      // would show "sync pending" for a session the server already has.
      // Local signals (the mirror, or a session stashed to the pending-sync
      // store after a failed save) are the fallback that still shows the
      // workout as done when the sync genuinely hasn't landed yet.
      const result = await fetchLatestSessionSummaryForDate(today);
      if (cancelled) return;
      if (result.ok && result.data) {
        setCompleted({ durationSeconds: result.data.durationSeconds, synced: true, status: result.data.status });
        return;
      }

      const local = loadLocalSession();
      if (local && (local.status === "completed" || local.status === "modified") && local.sessionDate === today) {
        setCompleted({ durationSeconds: local.durationSeconds, synced: false, status: local.status });
        return;
      }
      const pending = loadPendingSessions().find((session) => session.sessionDate === today);
      if (pending) {
        setCompleted({ durationSeconds: pending.durationSeconds, synced: false, status: pending.status });
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [today]);

  // Until the checks above resolve, the current Start/Resume button keeps
  // rendering as-is (below) rather than a loading placeholder — a brief
  // window where a completed session isn't reflected yet is an acceptable
  // flash; a placeholder in its place would just trade one flash for
  // another.
  if (completed) {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-line-default bg-surface-1 p-4">
        <p className="text-sm font-medium text-ink-primary">
          {completed.status === "modified" ? "Modified session today" : "Completed today"}
          {completed.durationSeconds !== null ? (
            <span className="text-ink-secondary"> &middot; {formatMinutes(completed.durationSeconds)}</span>
          ) : null}
        </p>
        {completed.synced ? (
          <Link
            href={`/history/${today}`}
            className="text-sm font-medium text-accent-strong underline underline-offset-4"
          >
            View session
          </Link>
        ) : (
          <p className="text-xs text-ink-tertiary">Saved on this device, sync pending.</p>
        )}
        <Link
          href="/workout/active"
          className="w-fit text-xs font-medium text-ink-tertiary underline underline-offset-4"
        >
          Start another workout
        </Link>
      </div>
    );
  }

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
