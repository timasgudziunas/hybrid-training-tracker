/**
 * Serializes Supabase saves of a WorkoutSessionRecord so overlapping upserts
 * can never reorder (the 2026-08-26 "phantom active" incident: handleFinish
 * awaited a final save with status 'completed', but never cancelled the
 * pending debounce timer, so a stale pre-finish record saved AFTER the
 * finish save overwrote the row back to 'active'). A single queue instance
 * per active-workout mount is the fix: every save request funnels through
 * it, at most one upsert is ever in flight, and a record requested later can
 * never be persisted before one requested earlier.
 *
 * Pure module: no React, no window, no Supabase import. The caller supplies
 * the actual save function (`saveWorkoutSession` server action in practice).
 */

import type { WorkoutSessionRecord } from './workout-session-types';

export type SessionSaveFn = (record: WorkoutSessionRecord) => Promise<{ ok: boolean }>;

export interface SessionSaveQueue {
  /**
   * Requests a save of `record`. If nothing is in flight, the save starts
   * immediately. If a save is already in flight, `record` replaces any
   * previously queued-but-not-started record — coalescing means only the
   * latest request after the in-flight save's snapshot ever gets persisted,
   * which is exactly what "latest wins, never a stale overwrite" requires.
   */
  request(record: WorkoutSessionRecord): void;
  /**
   * Resolves once the queue is fully drained: no save in flight and nothing
   * queued behind it. Resolves with the ok of the LAST completed save (or
   * true if nothing was ever requested). Safe to call from multiple sites
   * concurrently — every caller resolves together when the drain completes.
   */
  settle(): Promise<boolean>;
}

export function createSessionSaveQueue(save: SessionSaveFn): SessionSaveQueue {
  let inFlight = false;
  let queuedRecord: WorkoutSessionRecord | null = null;
  // Starts true: settle() before any request() has ever happened means
  // there is nothing to have failed.
  let lastOk = true;
  let settleWaiters: Array<(ok: boolean) => void> = [];

  function resolveSettledWaiters(): void {
    if (settleWaiters.length === 0) return;
    const waiters = settleWaiters;
    settleWaiters = [];
    for (const resolve of waiters) resolve(lastOk);
  }

  // Starts the next save if one is queued and nothing is currently in
  // flight; otherwise the queue is drained and any settle() callers resolve.
  function pump(): void {
    if (inFlight) return;
    if (queuedRecord === null) {
      resolveSettledWaiters();
      return;
    }

    const record = queuedRecord;
    queuedRecord = null;
    inFlight = true;

    // A rejecting save function is treated as { ok: false } rather than
    // thrown out of the queue, so one bad save never wedges the pump.
    Promise.resolve()
      .then(() => save(record))
      .then(
        (result) => result.ok,
        () => false
      )
      .then((ok) => {
        lastOk = ok;
        inFlight = false;
        pump();
      });
  }

  return {
    request(record) {
      queuedRecord = record;
      pump();
    },
    settle() {
      return new Promise<boolean>((resolve) => {
        if (!inFlight && queuedRecord === null) {
          resolve(lastOk);
        } else {
          settleWaiters.push(resolve);
        }
      });
    },
  };
}
