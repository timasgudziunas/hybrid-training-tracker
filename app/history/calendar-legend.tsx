/** Restrained dot/tint legend (CLAUDE.md UX principles: no gamification,
 * adherence percent over streaks — this is the only decoding aid needed). */
export default function CalendarLegend() {
  const swatches: { label: string; className: string }[] = [
    { label: "Completed", className: "bg-success-soft" },
    { label: "Modified", className: "bg-warning-soft" },
    { label: "Missed", className: "bg-danger-soft" },
    { label: "Rest day", className: "bg-surface-2" },
    { label: "Scheduled, not yet done", className: "bg-accent-soft" },
  ];

  return (
    <div className="flex flex-col gap-2 border-t border-line-hairline pt-4">
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {swatches.map((swatch) => (
          <div key={swatch.label} className="flex items-center gap-1.5 text-xs text-ink-secondary">
            <span
              className={`h-3 w-3 rounded-[4px] border border-line-hairline ${swatch.className}`}
              aria-hidden="true"
            />
            {swatch.label}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-ink-secondary">
          <span className="h-3 w-3 rounded-[4px] border border-accent" aria-hidden="true" />
          Today
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink-tertiary">
        <div className="flex items-center gap-1.5">
          <span className="h-1 w-1 rounded-full bg-accent" aria-hidden="true" />
          Ultimate practice attended
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1 w-1 rounded-full bg-ink-tertiary" aria-hidden="true" />
          Body check-in logged
        </div>
      </div>
    </div>
  );
}
