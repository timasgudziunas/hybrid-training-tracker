"use client";

import { useState } from "react";
import type { EndedEarlyReason } from "@/lib/workout-session/workout-session-types";

const REASON_OPTIONS: { value: EndedEarlyReason; label: string }[] = [
  { value: "time", label: "Out of time" },
  { value: "fatigue", label: "Fatigue" },
  { value: "discomfort", label: "Discomfort or pain" },
  { value: "other", label: "Other" },
];

/**
 * Inline, no-modal "End workout early" (Phase 5, PRODUCT_SPEC §14
 * modify-don't-fail). Reason is optional context only, never a diagnosis
 * (CLAUDE.md non-negotiable 19 handles the restrained follow-up when
 * "discomfort" is picked, on the completion screen). Confirming hands the
 * chosen reason (or undefined) back to the caller, which marks every
 * still-upcoming slot skipped and moves the athlete to the completion
 * screen.
 */
export default function EndWorkoutEarlyControl({
  onConfirm,
}: {
  onConfirm: (reason?: EndedEarlyReason) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<EndedEarlyReason | undefined>(undefined);

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="self-start rounded-lg border border-line-default px-3 py-2 text-xs font-medium text-ink-secondary transition-colors active:bg-surface-2"
      >
        End workout early
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line-default bg-surface-2/60 p-4">
      <p className="text-sm text-ink-secondary">Anything still upcoming will be marked skipped.</p>
      <div className="flex flex-wrap gap-2">
        {REASON_OPTIONS.map((option) => {
          const isSelected = selected === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelected(isSelected ? undefined : option.value)}
              aria-pressed={isSelected}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                isSelected
                  ? "border-accent bg-accent-soft text-accent-strong"
                  : "border-line-default text-ink-secondary active:bg-surface-2"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="h-11 rounded-lg border border-line-default px-4 text-sm font-medium text-ink-secondary transition-colors active:bg-surface-2"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onConfirm(selected)}
          className="h-11 flex-1 rounded-lg bg-accent text-sm font-semibold text-accent-ink shadow-card transition-colors active:bg-accent-strong"
        >
          End workout
        </button>
      </div>
    </div>
  );
}
