const TONE_CLASS: Record<string, string> = {
  success: "text-success",
  warning: "text-warning",
};

/** One small labeled stat, matching the tile treatment used throughout the
 * app (e.g. app/history/[date]/
 * session-detail.tsx) rather than inventing a new card style for Review. */
export default function ReviewStatTile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "success" | "warning";
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-line-hairline bg-surface-2 p-3">
      <p className="text-xs text-ink-tertiary">{label}</p>
      <p className={`font-display text-xl font-semibold tabular-nums ${tone ? TONE_CLASS[tone] : "text-ink-primary"}`}>
        {value}
      </p>
      {sub ? <p className="text-[11px] text-ink-tertiary">{sub}</p> : null}
    </div>
  );
}
