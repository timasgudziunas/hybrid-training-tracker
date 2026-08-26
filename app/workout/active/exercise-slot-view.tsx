import type { Exercise } from "@/lib/program/program-types";
import { REST_GUIDANCE_BY_CATEGORY } from "@/lib/program/rest-guidance";
import type { TemplateSlot } from "@/lib/workout-session/flatten-template-slots";
import type {
  ExerciseSlotLog,
  PreviousPerformanceByExercise,
  SetLog,
} from "@/lib/workout-session/workout-session-types";
import { resolveExerciseChoiceName } from "@/app/today/resolve-exercise-name";
import ExerciseChoiceCard from "./exercise-choice-card";
import ExerciseEntryCard from "./exercise-entry-card";
import QualitativeEntryCard from "./qualitative-entry-card";
import ExerciseGuidanceDisclosure from "./exercise-guidance-disclosure";
import ExerciseNoteField from "./exercise-note-field";

/**
 * One card in the linear flow: the "or" choice screen when the slot hasn't
 * been decided yet, otherwise the type-appropriate logging body, plus the
 * chrome every slot shares (name, rest guidance, "Help me feel it", note,
 * skip). `exercises` is the session's own exercisesSnapshot (2026-08-25
 * rework) — never the old static catalog — so names/guidance always match
 * exactly what was active when this session started.
 */
export default function ExerciseSlotView({
  templateSlot,
  slotLog,
  previousPerformance,
  exercises,
  onChoose,
  onLogSet,
  onRemoveLastSet,
  onAddExtraSet,
  onAdvance,
  onSkip,
  onSetNote,
  onQualitativeComplete,
  onDraftChange,
}: {
  templateSlot: TemplateSlot;
  slotLog: ExerciseSlotLog;
  previousPerformance: PreviousPerformanceByExercise;
  exercises: Record<string, Exercise>;
  onChoose: (exerciseId: string) => void;
  onLogSet: (set: SetLog) => void;
  onRemoveLastSet: () => void;
  onAddExtraSet: () => void;
  onAdvance: () => void;
  onSkip: () => void;
  onSetNote: (note: string) => void;
  onQualitativeComplete: () => void;
  onDraftChange: (draft: ExerciseSlotLog["draft"]) => void;
}) {
  const prescribed = templateSlot.exercise;

  if (!slotLog.chosenExerciseId) {
    return (
      <div className="flex flex-col gap-5">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">
          {templateSlot.section.name}
        </p>
        <ExerciseChoiceCard
          primaryExerciseId={prescribed.exerciseId}
          alternativeExerciseIds={prescribed.alternativeExerciseIds ?? []}
          exercises={exercises}
          onChoose={onChoose}
        />
        <button
          type="button"
          onClick={onSkip}
          className="self-start text-xs font-medium text-ink-tertiary transition-colors active:text-ink-secondary"
        >
          Skip this exercise
        </button>
      </div>
    );
  }

  const chosenExercise = exercises[slotLog.chosenExerciseId];
  const name = resolveExerciseChoiceName(exercises, prescribed.exerciseId, prescribed.alternativeExerciseIds);
  const restGuidance = prescribed.restCategory ? REST_GUIDANCE_BY_CATEGORY[prescribed.restCategory] : null;

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-line-hairline bg-surface-1 p-5 shadow-card sm:p-6">
      <div className="flex flex-col gap-1.5">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">
          {templateSlot.section.name}
        </p>
        <h1 className="font-display text-2xl font-bold leading-tight text-ink-primary sm:text-3xl">{name}</h1>
        {restGuidance ? <p className="text-xs text-ink-tertiary">Rest: {restGuidance.guidance}</p> : null}
        {prescribed.notes?.length ? (
          <ul className="flex flex-col gap-0.5 text-xs text-ink-tertiary">
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
          onDraftChange={onDraftChange}
        />
      )}

      <div className="flex items-center justify-between border-t border-line-hairline pt-4">
        <ExerciseNoteField note={slotLog.note} onChange={onSetNote} />
        <button
          type="button"
          onClick={onSkip}
          className="text-xs font-medium text-ink-tertiary transition-colors active:text-ink-secondary"
        >
          Skip exercise
        </button>
      </div>
    </div>
  );
}
