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
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-widest text-zinc-600">RIR</span>
      <div className="flex gap-1.5">
        {RIR_OPTIONS.map((option) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(selected ? undefined : option)}
              className={`h-11 w-11 rounded-md border text-sm font-medium transition-colors ${
                selected
                  ? "border-white bg-white text-black"
                  : "border-zinc-700 text-zinc-300 active:bg-zinc-800"
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
