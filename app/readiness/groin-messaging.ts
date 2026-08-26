/**
 * Pure trigger logic for the restrained groin note (PRODUCT_SPEC.md §13,
 * CLAUDE.md non-negotiable 19, TRAINING_SYSTEM.md §20). This module only
 * decides WHETHER a note should be shown and what it says in general terms.
 * It never diagnoses a cause and never prescribes a rehab protocol; it only
 * suggests modifying today's sprint or cutting intensity and, when symptoms
 * persist, worsen, or affect sprinting or cutting, recommends assessment by
 * a sports medicine professional or physical therapist.
 *
 * Trigger rules:
 * 1. Today's groin status is 3 or higher (0 to 5 scale), OR
 * 2. Groin status has increased for 2 or more consecutive entries leading
 *    into today (each entry strictly higher than the one before it).
 */

export type GroinTrendEntry = {
  date: string;
  groinStatus: number | null;
};

export type GroinNoteReason = "elevated" | "trend" | null;

const ELEVATED_THRESHOLD = 3;
const MIN_CONSECUTIVE_INCREASES = 2;

/** `entries` must be sorted ascending by date and its last item must be
 * today's entry (possibly with a null groinStatus if not yet logged). */
export function groinNoteReason(entries: GroinTrendEntry[]): GroinNoteReason {
  if (entries.length === 0) return null;

  const today = entries[entries.length - 1];
  if (today.groinStatus === null) return null;

  if (today.groinStatus >= ELEVATED_THRESHOLD) return "elevated";

  let consecutiveIncreases = 0;
  for (let i = entries.length - 1; i > 0; i--) {
    const current = entries[i].groinStatus;
    const previous = entries[i - 1].groinStatus;
    if (current === null || previous === null) break;
    if (current > previous) {
      consecutiveIncreases += 1;
    } else {
      break;
    }
  }

  return consecutiveIncreases >= MIN_CONSECUTIVE_INCREASES ? "trend" : null;
}

const RESTRAINED_ADVICE =
  "Consider a lighter version of today's sprint work or easing off cutting intensity if it feels aggravated. " +
  "This is not a diagnosis. If it persists, worsens, or affects your sprinting or cutting, consider getting " +
  "assessed by a sports medicine professional or physical therapist.";

export function groinNoteCopy(reason: GroinNoteReason): string | null {
  if (reason === "elevated") {
    return `Groin or adductor status is elevated today. ${RESTRAINED_ADVICE}`;
  }
  if (reason === "trend") {
    return `Groin or adductor status has been rising over your last few entries. ${RESTRAINED_ADVICE}`;
  }
  return null;
}
