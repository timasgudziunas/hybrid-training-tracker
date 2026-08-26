import type { Exercise, PrescribedExercise, QualitativePrescription } from "@/lib/program/program-types";
import { REST_GUIDANCE_BY_CATEGORY } from "@/lib/program/rest-guidance";
import { formatApproxMinutes, formatPrescription } from "./format-prescription";
import { resolveExerciseChoiceName } from "./resolve-exercise-name";

function QualitativePrescriptionDetails({ prescription }: { prescription: QualitativePrescription }) {
  const minutes = formatApproxMinutes(prescription.approxMinMinutes, prescription.approxMaxMinutes);

  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm text-ink-secondary">{prescription.description}</p>
      {prescription.items?.length ? (
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-tertiary">
          {prescription.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {minutes ? <p className="text-xs text-ink-tertiary">{minutes}</p> : null}
    </div>
  );
}

export default function PrescribedExerciseRow({
  exercise,
  sectionName,
  exercises,
}: {
  exercise: PrescribedExercise;
  sectionName: string;
  exercises: Record<string, Exercise>;
}) {
  const name = resolveExerciseChoiceName(exercises, exercise.exerciseId, exercise.alternativeExerciseIds);
  const restGuidance = exercise.restCategory ? REST_GUIDANCE_BY_CATEGORY[exercise.restCategory] : null;
  // A section like "Dynamic Warm-Up" holding a single same-named qualitative
  // exercise would otherwise print its name twice in a row.
  const nameRepeatsSection = name.toLowerCase() === sectionName.toLowerCase();
  const showPrescriptionInline = exercise.prescription.type !== "qualitative";

  return (
    <li className="flex flex-col gap-1.5 py-3.5">
      {!nameRepeatsSection || showPrescriptionInline ? (
        <div className="flex items-baseline justify-between gap-3">
          {!nameRepeatsSection ? <span className="text-sm font-medium text-ink-primary">{name}</span> : null}
          {showPrescriptionInline ? (
            <span className="whitespace-nowrap font-display text-sm font-semibold tabular-nums text-ink-secondary">
              {formatPrescription(exercise.prescription)}
            </span>
          ) : null}
        </div>
      ) : null}

      {exercise.prescription.type === "qualitative" ? (
        <QualitativePrescriptionDetails prescription={exercise.prescription} />
      ) : null}

      {restGuidance ? <p className="text-xs text-ink-tertiary">Rest: {restGuidance.guidance}</p> : null}

      {exercise.notes?.length ? (
        <ul className="flex flex-col gap-0.5 text-xs text-ink-tertiary">
          {exercise.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}
