/**
 * Pure per-slot "time on this exercise" bookkeeping (owner: "when I click
 * off of an exercise and come back, I want it to save the time I spent on
 * it. Right now it resets back to zero and starts counting again"). Two
 * persisted fields on ExerciseSlotLog carry the accounting: `activeSeconds`
 * (the closed-out total from every earlier stint as the current exercise)
 * and `enteredAt` (an ISO timestamp, present only while the slot IS the
 * current exercise). Storing the timestamp rather than a running total
 * means a refresh, or the app being closed and reopened, keeps counting
 * exactly like the whole-session timer already does.
 *
 * No side effects, no React — the active-workout screen owns calling
 * `transitionCurrentSlot` from an effect keyed on `currentSlotKey` and
 * persisting the result.
 */

import type { ExerciseSlotLog } from './workout-session-types';

/** Seconds between two instants, clamped to 0 so clock skew (a device clock
 * stepping backwards, a stale `enteredAt`) never produces a negative span. */
function clampedSpanSeconds(fromMs: number, toMs: number): number {
  return Math.max(0, (toMs - fromMs) / 1000);
}

/**
 * Called whenever the athlete's current exercise changes (advance, skip,
 * jump via Overview, Finish/end-early, or the first render of a brand-new
 * or resumed session). Closes out `fromSlotKey`'s open stint, if it has one,
 * into `activeSeconds`, and opens `toSlotKey`'s stint by stamping
 * `enteredAt` — unless it already has one, so a resumed session keeps
 * counting from its original timestamp rather than restarting it. Either
 * key may be null (leaving the last exercise to go to Finish, or a session
 * with nothing current yet).
 *
 * Returns the SAME `slots` reference when nothing actually changes
 * (`fromSlotKey === toSlotKey`, a missing slot id, or a `to` slot that
 * already has `enteredAt`), so callers can skip a pointless save. Never
 * mutates `slots` or any slot object in place.
 */
export function transitionCurrentSlot(
  slots: Record<string, ExerciseSlotLog>,
  fromSlotKey: string | null,
  toSlotKey: string | null,
  nowIso: string
): Record<string, ExerciseSlotLog> {
  if (fromSlotKey === toSlotKey) return slots;

  let next = slots;

  if (fromSlotKey) {
    const fromSlot = slots[fromSlotKey];
    if (fromSlot?.enteredAt) {
      const nowMs = new Date(nowIso).getTime();
      const enteredAtMs = new Date(fromSlot.enteredAt).getTime();
      const elapsed = clampedSpanSeconds(enteredAtMs, nowMs);
      const closedSlot: ExerciseSlotLog = { ...fromSlot, activeSeconds: (fromSlot.activeSeconds ?? 0) + elapsed };
      delete closedSlot.enteredAt;
      next = { ...next, [fromSlotKey]: closedSlot };
    }
  }

  if (toSlotKey) {
    const toSlot = next[toSlotKey];
    if (toSlot && !toSlot.enteredAt) {
      next = { ...next, [toSlotKey]: { ...toSlot, enteredAt: nowIso } };
    }
  }

  return next;
}

/**
 * Live seconds-on-exercise for display: the closed-out `activeSeconds` plus
 * the running span since `enteredAt`, if the slot is currently open.
 * Clamped the same way as the transition above.
 */
export function slotElapsedSeconds(slot: ExerciseSlotLog | undefined, nowMs: number): number {
  if (!slot) return 0;
  const base = slot.activeSeconds ?? 0;
  if (!slot.enteredAt) return base;
  const enteredAtMs = new Date(slot.enteredAt).getTime();
  return base + clampedSpanSeconds(enteredAtMs, nowMs);
}
