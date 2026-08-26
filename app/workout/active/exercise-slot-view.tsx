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
import ExerciseSwapPicker from "./exercise-swap-picker";

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
  reducedLoad,
  onToggleReducedLoad,
  hasSubstitution,
  onSwap,
  onRevertSwap,
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
  reducedLoad: boolean;
  onToggleReducedLoad: () => void;
  hasSubstitution: boolean;
  onSwap: (exercise: Exercise) => void;
  onRevertSwap: () => void;
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
  // The chosen exercise wins the header once one is set: after an "or"
  // choice it names the picked side, and after a Phase 5 catalog swap it
  // names the substitute (the prescribed-based "A or B" string would
  // silently keep showing the original). Falls back to the prescribed
  // choice string only if the snapshot is somehow missing the chosen id.
  const name =
    chosenExercise?.name ?? resolveExerciseChoiceName(exercises, prescribed.exerciseId, prescribed.alternativeExerciseIds);
  const restGuidance = prescribed.restCategory ? REST_GUIDANCE_BY_CATEGORY[prescribed.restCategory] : null;
  const prescribedName = exercises[prescribed.exerciseId]?.name ?? prescribed.exerciseId;

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

      <div className="flex flex-col gap-3 border-t border-line-hairline pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ExerciseNoteField note={slotLog.note} onChange={onSetNote} />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onToggleReducedLoad}
              aria-pressed={reducedLoad}
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                reducedLoad
                  ? "border-accent bg-accent-soft text-accent-strong"
                  : "border-line-default text-ink-tertiary active:bg-surface-2"
              }`}
            >
              Going lighter
            </button>
            <ExerciseSwapPicker
              sectionType={templateSlot.section.type}
              currentChosenExerciseId={slotLog.chosenExerciseId}
              prescribedName={prescribedName}
              hasSubstitution={hasSubstitution}
              onPick={onSwap}
              onRevert={onRevertSwap}
            />
            <button
              type="button"
              onClick={onSkip}
              className="text-xs font-medium text-ink-tertiary transition-colors active:text-ink-secondary"
            >
              Skip exercise
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
