import type { QualitativePrescription } from "@/lib/program/program-types";

function formatApproxMinutes(min?: number, max?: number): string | null {
  if (min === undefined && max === undefined) return null;
  if (min !== undefined && max !== undefined) {
    return min === max ? `${min} min` : `${min}-${max} min`;
  }
  return `${min ?? max} min`;
}

/** Qualitative prescriptions (warm-ups, mobility flows, Zone 2, L-sit
 * practice) have no sets — a single "mark complete" tap. */
export default function QualitativeEntryCard({
  prescription,
  onComplete,
}: {
  prescription: QualitativePrescription;
  onComplete: () => void;
}) {
  const minutes = formatApproxMinutes(prescription.approxMinMinutes, prescription.approxMaxMinutes);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-secondary">{prescription.description}</p>

      {prescription.items?.length ? (
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-tertiary">
          {prescription.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}

      {minutes ? <p className="text-xs text-ink-tertiary">{minutes}</p> : null}

      <button
        type="button"
        onClick={onComplete}
        className="h-16 rounded-xl bg-accent text-lg font-semibold text-accent-ink transition-colors active:bg-accent-strong"
      >
        Mark complete
      </button>
    </div>
  );
}
