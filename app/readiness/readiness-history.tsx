import type { ReadinessEntry } from "./actions";

const DOT_CLASS: Record<string, string> = {
  green: "bg-success",
  yellow: "bg-warning",
  red: "bg-danger",
};

// A quiet list of recent entries: date, readiness color dot, and the groin
// number only when it is above zero (PRODUCT_SPEC §13). No interactivity, so
// no "use client" directive is needed.
export default function ReadinessHistory({ entries }: { entries: ReadinessEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-ink-tertiary">No entries yet.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-line-hairline rounded-2xl border border-line-hairline bg-surface-1 px-5">
      {entries.map((entry) => (
        <li key={entry.date} className="flex items-center gap-3 py-3">
          {entry.readiness ? (
            <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${DOT_CLASS[entry.readiness]}`} />
          ) : (
            <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full border border-line-default" />
          )}
          <span className="text-sm text-ink-primary">{entry.date}</span>
          {entry.groinStatus !== null && entry.groinStatus > 0 ? (
            <span className="ml-auto font-display text-sm font-semibold tabular-nums text-ink-secondary">
              Groin {entry.groinStatus}/5
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
