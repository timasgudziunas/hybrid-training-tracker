/**
 * Compact strip copy for the active-workout exercise card (R3, UI half).
 * Pure formatting only: takes the progression engine's already-computed
 * recommendation and evidence and renders plain, specific sentences. Never
 * re-derives or second-guesses the progression decision itself, which stays
 * entirely in double-progression.ts / hold-progression.ts (CLAUDE.md
 * non-negotiable 17: transparent, deterministic, always shown, never hidden
 * behind a model).
 *
 * No em dashes, en dashes, or hyphens used as punctuation (owner hard
 * rule) — periods and commas only.
 */

import type { ProgressionRecommendation, HoldProgressionRecommendation, ProgressionEvidenceSet } from './progression-types';

export interface ProgressionStripUseChip {
  label: string;
  value: number;
}

export interface ProgressionStrip {
  headline: string;
  useChip?: ProgressionStripUseChip;
  evidenceLines: string[];
}

function formatRepetitionsEvidenceLines(consideredSets: ProgressionEvidenceSet[] | undefined): string[] {
  if (!consideredSets) return [];
  return consideredSets.map((s) => {
    if (!s.completed) return `Set ${s.setNumber}: not completed`;
    const weightPart = s.weight !== undefined ? `${s.weight} lb x ` : '';
    const repsPart = s.reps !== undefined ? `${s.reps} reps` : 'no reps logged';
    const rirPart = s.rir !== undefined ? `, ${s.rir} RIR` : '';
    return `Set ${s.setNumber}: ${weightPart}${repsPart}${rirPart}`;
  });
}

function formatHoldEvidenceLines(consideredSets: ProgressionEvidenceSet[] | undefined): string[] {
  if (!consideredSets) return [];
  return consideredSets.map((s) => {
    if (!s.completed) return `Set ${s.setNumber}: not completed`;
    return s.seconds !== undefined ? `Set ${s.setNumber}: ${s.seconds} sec` : `Set ${s.setNumber}: no time logged`;
  });
}

/** Picks the weakest qualifying set (lowest logged reps, first one on a
 * tie) for the add-reps headline, e.g. "push set 3 to 8". */
function findWeakestSet(consideredSets: ProgressionEvidenceSet[]): ProgressionEvidenceSet | undefined {
  const withReps = consideredSets.filter((s) => s.reps !== undefined);
  if (withReps.length === 0) return undefined;
  return withReps.reduce((weakest, current) =>
    (current.reps as number) < (weakest.reps as number) ? current : weakest
  );
}

/**
 * Strip copy for a repetitions-type recommendation. Returns null for
 * no-data — the card's existing "First time, no history yet" line already
 * covers that case, so nothing extra is added.
 */
export function formatRepetitionsProgressionStrip(
  recommendation: ProgressionRecommendation
): ProgressionStrip | null {
  const { evidence } = recommendation;
  const consideredSets = evidence.consideredSets;

  if (recommendation.action === 'increase-load' && recommendation.suggestedWeight !== undefined) {
    return {
      headline: `Suggested: ${recommendation.suggestedWeight} lb, work ${recommendation.targetReps}`,
      useChip: { label: `Use ${recommendation.suggestedWeight} lb`, value: recommendation.suggestedWeight },
      evidenceLines: formatRepetitionsEvidenceLines(consideredSets),
    };
  }

  if (recommendation.action === 'add-reps') {
    const weakest = consideredSets ? findWeakestSet(consideredSets) : undefined;
    const nextTarget = recommendation.targetReps?.split(' to ')[0];
    const headline =
      weakest && nextTarget
        ? `Add reps: push set ${weakest.setNumber} to ${nextTarget}`
        : `Add reps: work toward ${recommendation.targetReps ?? 'the top of the range'}`;
    return { headline, evidenceLines: formatRepetitionsEvidenceLines(consideredSets) };
  }

  if (recommendation.action === 'hold') {
    const headline =
      recommendation.suggestedWeight !== undefined
        ? `Hold at ${recommendation.suggestedWeight} lb`
        : 'Hold: keep the same weight';
    return { headline, evidenceLines: formatRepetitionsEvidenceLines(consideredSets) };
  }

  return null;
}

/**
 * Strip copy for a hold/duration-type recommendation. Returns null for
 * no-data, for the same reason as above.
 */
export function formatHoldProgressionStrip(
  recommendation: HoldProgressionRecommendation
): ProgressionStrip | null {
  const { evidence } = recommendation;
  const consideredSets = evidence.consideredSets;

  if (recommendation.action === 'increase-target' && recommendation.suggestedTargetSeconds !== undefined) {
    return {
      headline: `Suggested: work toward ${recommendation.suggestedTargetSeconds} sec`,
      useChip: {
        label: `Use ${recommendation.suggestedTargetSeconds} sec`,
        value: recommendation.suggestedTargetSeconds,
      },
      evidenceLines: formatHoldEvidenceLines(consideredSets),
    };
  }

  if (recommendation.action === 'hold') {
    const headline = `Hold: work toward ${evidence.maxSeconds} sec`;
    return { headline, evidenceLines: formatHoldEvidenceLines(consideredSets) };
  }

  return null;
}
