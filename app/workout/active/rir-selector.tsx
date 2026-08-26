"use client";

const RIR_OPTIONS = [0, 1, 2, 3, 4] as const;

/** Quick-tap RIR (reps in reserve) selector, TRAINING_SYSTEM.md §11.
 * Optional by design — tapping the already-selected value clears it. */
export default function RirSelector({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">RIR</span>
      <div className="flex gap-1.5">
        {RIR_OPTIONS.map((option) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(selected ? undefined : option)}
              className={`h-11 w-11 rounded-lg border font-display text-base font-semibold tabular-nums transition-colors ${
                selected
                  ? "border-accent bg-accent text-accent-ink"
                  : "border-line-default text-ink-secondary active:bg-surface-2"
              }`}
              aria-pressed={selected}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
