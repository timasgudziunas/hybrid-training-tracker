import type { ReadinessColor } from "./actions";

const READINESS_LABELS: Record<ReadinessColor, string> = {
  green: "Ready",
  yellow: "Manage",
  red: "Back off",
};

const READINESS_DOT: Record<ReadinessColor, string> = {
  green: "bg-success",
  yellow: "bg-warning",
  red: "bg-danger",
};

export type ReadinessFormValues = {
  sleepHours: string;
  energy: number | null;
  soreness: number | null;
  groinStatus: number | null;
  readiness: ReadinessColor | null;
  notes: string;
};

// Compact read-only view of today's saved entry, shown until Edit is tapped.
export default function ReadinessSummary({ form }: { form: ReadinessFormValues }) {
  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryStat label="Sleep" value={form.sleepHours ? `${form.sleepHours}h` : "Not logged"} />
        <SummaryStat label="Energy" value={form.energy !== null ? `${form.energy}/5` : "Not logged"} />
        <SummaryStat label="Soreness" value={form.soreness !== null ? `${form.soreness}/5` : "Not logged"} />
        <SummaryStat label="Groin" value={form.groinStatus !== null ? `${form.groinStatus}/5` : "Not logged"} />
      </div>
      {form.readiness ? (
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${READINESS_DOT[form.readiness]}`} />
          <span className="text-sm text-ink-primary">{READINESS_LABELS[form.readiness]}</span>
        </div>
      ) : null}
      {form.notes ? <p className="text-sm text-ink-secondary">{form.notes}</p> : null}
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line-hairline bg-surface-2 p-3">
      <p className="text-xs text-ink-tertiary">{label}</p>
      <p className="font-display text-xl font-semibold tabular-nums text-ink-primary">{value}</p>
    </div>
  );
}
