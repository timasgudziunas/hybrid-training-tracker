import type { Prescription } from "@/lib/program/program-types";

function formatRange(min: number, max: number): string {
  return min === max ? `${min}` : `${min}-${max}`;
}

/**
 * Renders a Prescription as the short summary line shown next to an
 * exercise's name (e.g. "3 x 6-10", "4 x 10-20 sec"). Qualitative
 * prescriptions render their description here; their items list and
 * approximate minutes are rendered separately (see QualitativePrescriptionDetails
 * in prescribed-exercise-row.tsx) since they aren't a single "sets x reps" line.
 */
export function formatPrescription(prescription: Prescription): string {
  switch (prescription.type) {
    case "repetitions": {
      const perSide = prescription.perSide ? " (each side)" : "";
      return `${prescription.sets} x ${formatRange(prescription.minReps, prescription.maxReps)}${perSide}`;
    }
    case "hold": {
      const perSide = prescription.perSide ? " (each side)" : "";
      return `${prescription.sets} x ${formatRange(prescription.minSeconds, prescription.maxSeconds)} sec${perSide}`;
    }
    case "duration": {
      const perSide = prescription.perSide ? " (each side)" : "";
      return `${prescription.sets} x ${formatRange(prescription.minSeconds, prescription.maxSeconds)} sec${perSide}`;
    }
    case "distance": {
      return `${prescription.sets} x ${prescription.meters} m`;
    }
    case "qualitative": {
      return prescription.description;
    }
  }
}

/** "8-10 min" / "10 min" style range for a qualitative prescription's
 * approximate duration. Returns null when neither bound is given. */
export function formatApproxMinutes(
  approxMinMinutes?: number,
  approxMaxMinutes?: number
): string | null {
  if (approxMinMinutes === undefined && approxMaxMinutes === undefined) {
    return null;
  }
  if (approxMinMinutes !== undefined && approxMaxMinutes !== undefined) {
    return `${formatRange(approxMinMinutes, approxMaxMinutes)} min`;
  }
  return `${approxMinMinutes ?? approxMaxMinutes} min`;
}
