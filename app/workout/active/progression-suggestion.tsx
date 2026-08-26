"use client";

import { useMemo, useState } from "react";
import type { Prescription } from "@/lib/program/program-types";
import type { SetLog } from "@/lib/workout-session/workout-session-types";
import { recommendProgression } from "@/lib/progression/recommend-progression";
import type {
  HoldProgressionRecommendation,
  ProgressionRecommendation,
} from "@/lib/progression/progression-types";
import {
  formatHoldProgressionStrip,
  formatRepetitionsProgressionStrip,
  type ProgressionStrip,
} from "@/lib/progression/format-progression-strip";

/**
 * Surfaces the progression engine's recommendation on the active-workout
 * exercise card (R3, UI half; PRODUCT_SPEC §8, CLAUDE.md non-negotiable 17).
 * Computed once per slot via useMemo from the slot's prescription plus the
 * single most recent prior exposure (there is only ever one, since
 * fetchPreviousPerformance already returns just the last session) — never
 * recomputed per keystroke. Never auto-applies anything: the weight/seconds
 * input keeps its own last-time prefill regardless of what this renders.
 *
 * Renders nothing for no-data (the card's own "First time, no history yet"
 * line already covers that) and for not-applicable (distance and
 * qualitative prescriptions have no progression model).
 */
export default function ProgressionSuggestion({
  prescription,
  previousSets,
  onUseWeight,
  onUseSeconds,
}: {
  prescription: Exclude<Prescription, { type: "qualitative" }>;
  previousSets: SetLog[] | undefined;
  onUseWeight: (weight: number) => void;
  onUseSeconds: (seconds: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const recommendation = useMemo(() => {
    const history = previousSets && previousSets.length > 0 ? [previousSets] : [];
    return recommendProgression({ prescription, history });
  }, [prescription, previousSets]);

  if (recommendation.action === "no-data" || recommendation.action === "not-applicable") {
    return null;
  }

  // recommendProgression's branch is fully determined by prescription.type,
  // so this narrowing is safe: repetitions always yields a
  // ProgressionRecommendation, hold/duration always yields a
  // HoldProgressionRecommendation.
  const strip: ProgressionStrip | null =
    prescription.type === "repetitions"
      ? formatRepetitionsProgressionStrip(recommendation as ProgressionRecommendation)
      : formatHoldProgressionStrip(recommendation as HoldProgressionRecommendation);

  if (!strip) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line-hairline/60 bg-surface-2/40 px-3.5 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-ink-secondary">{strip.headline}</p>
        <div className="flex shrink-0 items-center gap-2">
          {strip.useChip ? (
            <button
              type="button"
              onClick={() =>
                prescription.type === "repetitions"
                  ? onUseWeight(strip.useChip!.value)
                  : onUseSeconds(strip.useChip!.value)
              }
              className="rounded-md border border-accent/40 bg-accent-soft px-2.5 py-1.5 text-[11px] font-medium text-accent-strong transition-colors active:bg-accent/25"
            >
              {strip.useChip.label}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            className="flex items-center gap-1 py-1.5 text-[11px] font-medium text-ink-tertiary transition-colors active:text-ink-secondary"
          >
            <svg
              viewBox="0 0 12 12"
              className={`h-2.5 w-2.5 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
              aria-hidden="true"
            >
              <path
                d="M4 2l4 4-4 4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {expanded ? "Hide why" : "Why"}
          </button>
        </div>
      </div>

      <div className={`disclosure-panel ${expanded ? "is-open" : ""}`}>
        <div>
          <div className="flex flex-col gap-2 rounded-md border border-line-hairline bg-surface-1 p-3 text-xs text-ink-secondary">
            <p>{recommendation.reason}</p>
            {strip.evidenceLines.length > 0 ? (
              <ul className="flex flex-col gap-0.5 tabular-nums text-ink-tertiary">
                {strip.evidenceLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
