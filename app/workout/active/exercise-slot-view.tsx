import { EXERCISE_CATALOG } from "@/lib/program/exercise-catalog";
import { REST_GUIDANCE_BY_CATEGORY } from "@/lib/program/rest-guidance";
import type { TemplateSlot } from "@/lib/workout-session/flatten-template-slots";
import type { ExerciseSlotLog, PreviousPerformanceByExercise, SetLog } from "@/lib/workout-session/workout-session-types";
import { resolveExerciseChoiceName } from "@/app/today/resolve-exercise-name";
import ExerciseChoiceCard from "./exercise-choice-card";
import ExerciseEntryCard from "./exercise-entry-card";
import QualitativeEntryCard from "./qualitative-entry-card";
import ExerciseGuidanceDisclosure from "./exercise-guidance-disclosure";
import ExerciseNoteField from "./exercise-note-field";

const EXERCISE_BY_ID = new Map(EXERCISE_CATALOG.map((exercise) => [exercise.id, exercise]));

/**
 * One card in the linear flow: the "or" choice screen when the slot hasn't
 * been decided yet, otherwise the type-appropriate logging body, plus the
 * chrome every slot shares (name, rest guidance, "Help me feel it", note,
 * skip).
 */
export default function ExerciseSlotView({
  templateSlot,
  slotLog,
  previousPerformance,
  onChoose,
  onLogSet,
  onRemoveLastSet,
  onAddExtraSet,
  onAdvance,
  onSkip,
  onSetNote,
  onQualitativeComplete,
}: {
  templateSlot: TemplateSlot;
  slotLog: ExerciseSlotLog;
  previousPerformance: PreviousPerformanceByExercise;
  onChoose: (exerciseId: string) => void;
  onLogSet: (set: SetLog) => void;
  onRemoveLastSet: () => void;
  onAddExtraSet: () => void;
  onAdvance: () => void;
  onSkip: () => void;
  onSetNote: (note: string) => void;
  onQualitativeComplete: () => void;
}) {
  const prescribed = templateSlot.exercise;

  if (!slotLog.chosenExerciseId) {
    return (
      <div className="flex flex-col gap-5">
        <ExerciseChoiceCard
          primaryExerciseId={prescribed.exerciseId}
          alternativeExerciseIds={prescribed.alternativeExerciseIds ?? []}
          onChoose={onChoose}
        />
        <button type="button" onClick={onSkip} className="self-start text-xs text-zinc-500 active:text-zinc-300">
          Skip this exercise
        </button>
      </div>
    );
  }

  const chosenExercise = EXERCISE_BY_ID.get(slotLog.chosenExerciseId);
  const name = resolveExerciseChoiceName(prescribed.exerciseId, prescribed.alternativeExerciseIds);
  const restGuidance = prescribed.restCategory ? REST_GUIDANCE_BY_CATEGORY[prescribed.restCategory] : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <p className="text-[10px] uppercase tracking-widest text-zinc-600">{templateSlot.section.name}</p>
        <h1 className="text-lg font-semibold text-white">{name}</h1>
        {restGuidance ? <p className="text-xs text-zinc-600">Rest: {restGuidance.guidance}</p> : null}
        {prescribed.notes?.length ? (
          <ul className="flex flex-col gap-0.5 text-xs text-zinc-500">
            {prescribed.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        ) : null}
      </div>

      {chosenExercise ? <ExerciseGuidanceDisclosure exercise={chosenExercise} /> : null}

      {prescribed.prescription.type === "qualitative" ? (
        <QualitativeEntryCard prescription={prescribed.prescription} onComplete={onQualitativeComplete} />
      ) : (
        <ExerciseEntryCard
          slotLog={slotLog}
          prescription={prescribed.prescription}
          previousSets={previousPerformance[slotLog.chosenExerciseId]}
          onLogSet={onLogSet}
          onRemoveLastSet={onRemoveLastSet}
          onAddExtraSet={onAddExtraSet}
          onAdvance={onAdvance}
        />
      )}

      <div className="flex items-center justify-between border-t border-zinc-900 pt-3">
        <ExerciseNoteField note={slotLog.note} onChange={onSetNote} />
        <button type="button" onClick={onSkip} className="text-xs text-zinc-500 active:text-zinc-300">
          Skip exercise
        </button>
      </div>
    </div>
  );
}
