"use client";

import { useState } from "react";
import type { Exercise } from "@/lib/program/program-types";

/**
 * "Help me feel it" (PRODUCT_SPEC §6, owner request 2026-08-25): an inline,
 * never-blocking disclosure of muscle-activation guidance sourced only from
 * the exercise catalog's optional instructional fields — intendedFeeling,
 * cues, commonMistakes (lib/program/exercise-catalog.ts, owned by a
 * different work stream; this component never invents content). Hidden
 * entirely when an exercise carries none of those fields.
 */
export default function ExerciseGuidanceDisclosure({ exercise }: { exercise: Exercise }) {
  const [expanded, setExpanded] = useState(false);

  const hasGuidance = Boolean(
    exercise.intendedFeeling || exercise.cues?.length || exercise.commonMistakes?.length
  );

  if (!hasGuidance) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        className="flex w-fit cursor-pointer items-center gap-1.5 text-xs font-medium text-accent-strong transition-colors active:text-ink-primary"
      >
        <svg
          viewBox="0 0 12 12"
          className={`h-3 w-3 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
          aria-hidden="true"
        >
          <path d="M4 2l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {expanded ? "Hide guidance" : "Help me feel it"}
      </button>

      <div className={`disclosure-panel ${expanded ? "is-open" : ""}`}>
        <div>
          <div className="flex flex-col gap-2 rounded-xl border border-line-hairline bg-surface-2 p-4 text-xs text-ink-secondary">
            {exercise.intendedFeeling ? (
              <p>
                <span className="font-medium text-ink-primary">Where you should feel it: </span>
                {exercise.intendedFeeling}
              </p>
            ) : null}
            {exercise.cues?.length ? (
              <div>
                <p className="font-medium text-ink-primary">Cues</p>
                <ul className="list-inside list-disc">
                  {exercise.cues.map((cue) => (
                    <li key={cue}>{cue}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {exercise.commonMistakes?.length ? (
              <div>
                <p className="font-medium text-ink-primary">Common mistakes</p>
                <ul className="list-inside list-disc">
                  {exercise.commonMistakes.map((mistake) => (
                    <li key={mistake}>{mistake}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
