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
      <p className="text-sm text-zinc-400">{prescription.description}</p>

      {prescription.items?.length ? (
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500">
          {prescription.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}

      {minutes ? <p className="text-xs text-zinc-600">{minutes}</p> : null}

      <button
        type="button"
        onClick={onComplete}
        className="h-16 rounded-md bg-white text-lg font-semibold text-black active:bg-zinc-300"
      >
        Mark complete
      </button>
    </div>
  );
}
