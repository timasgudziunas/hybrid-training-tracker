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
        className="self-start text-xs font-medium text-zinc-400 underline decoration-zinc-700 underline-offset-4 active:text-zinc-200"
      >
        {expanded ? "Hide guidance" : "Help me feel it"}
      </button>

      {expanded ? (
        <div className="flex flex-col gap-2 rounded-md border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400">
          {exercise.intendedFeeling ? (
            <p>
              <span className="font-medium text-zinc-300">Where you should feel it: </span>
              {exercise.intendedFeeling}
            </p>
          ) : null}
          {exercise.cues?.length ? (
            <div>
              <p className="font-medium text-zinc-300">Cues</p>
              <ul className="list-inside list-disc">
                {exercise.cues.map((cue) => (
                  <li key={cue}>{cue}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {exercise.commonMistakes?.length ? (
            <div>
              <p className="font-medium text-zinc-300">Common mistakes</p>
              <ul className="list-inside list-disc">
                {exercise.commonMistakes.map((mistake) => (
                  <li key={mistake}>{mistake}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
