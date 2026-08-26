// A row of tappable numeric chips for a small closed scale (energy, soreness,
// groin status). Tapping the already-selected chip clears it, so a scale
// entry stays optional. No directive needed here: this is a leaf used only
// inside readiness-checkin.tsx's "use client" boundary.
export default function ScaleChips({
  label,
  options,
  value,
  onChange,
  endLabels,
}: {
  label: string;
  options: readonly number[];
  value: number | null;
  onChange: (value: number | null) => void;
  endLabels?: Record<number, string>;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">{label}</span>
      <div className="flex gap-1.5">
        {options.map((option) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(selected ? null : option)}
              aria-pressed={selected}
              className={`flex h-12 flex-1 items-center justify-center rounded-lg border font-display text-base font-semibold tabular-nums transition-colors ${
                selected
                  ? "border-accent bg-accent text-accent-ink"
                  : "border-line-default text-ink-secondary active:bg-surface-2"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {endLabels ? (
        <div className="flex justify-between px-0.5 text-[10px] text-ink-tertiary">
          <span>{endLabels[options[0]] ?? ""}</span>
          <span>{endLabels[options[options.length - 1]] ?? ""}</span>
        </div>
      ) : null}
    </div>
  );
}
