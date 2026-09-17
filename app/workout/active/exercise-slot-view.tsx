"use client";

import { useEffect, useRef, useState } from "react";
import type { Exercise } from "@/lib/program/program-types";
import { REST_GUIDANCE_BY_CATEGORY } from "@/lib/program/rest-guidance";
import type { TemplateSlot } from "@/lib/workout-session/flatten-template-slots";
import type {
  ExerciseSlotLog,
  PreviousPerformanceByExercise,
  SetLog,
} from "@/lib/workout-session/workout-session-types";
import { isCardioSlot } from "@/lib/workout-session/cardio-slot";
import { resolveExerciseChoiceName } from "@/app/today/resolve-exercise-name";
import CardioEntryCard from "./cardio-entry-card";
import ExerciseChoiceCard from "./exercise-choice-card";
import ExerciseEntryCard from "./exercise-entry-card";
import QualitativeEntryCard from "./qualitative-entry-card";
import ExerciseGuidanceDisclosure from "./exercise-guidance-disclosure";
import ExerciseNoteField from "./exercise-note-field";
import ExerciseSwapPicker from "./exercise-swap-picker";
import PreviousPerformanceSummary from "./previous-performance-summary";

/**
 * One card in the linear flow: the "or" choice screen when the slot hasn't
 * been decided yet, otherwise the type-appropriate logging body, plus the
 * chrome every slot shares (name, rest guidance, "Help me feel it", note,
 * skip). `exercises` is the session's own exercisesSnapshot (2026-08-25
 * rework) — never the old static catalog — so names/guidance always match
 * exactly what was active when this session started.
 *
 * Owns the swap panel's expand/collapse state (2026-09-17 rework: the panel
 * used to live entirely inside ExerciseSwapPicker, squeezed into the
 * footer's row of small controls, which read as "not mobile" per owner
 * feedback). The footer keeps a small "Swap" text trigger; the panel itself
 * renders as its own full-width block below the footer row, still inside
 * the card, and is scrolled into view when it opens.
 */
export default function ExerciseSlotView({
  templateSlot,
  slotLog,
  previousPerformance,
  exercises,
  showRir,
  advanceLabel,
  supersetInfo,
  logSetLabel,
  onChoose,
  onLogSet,
  onRemoveCurrentSet,
  onDeleteSet,
  onAddExtraSet,
  onAdvance,
  onSkip,
  onUnskip,
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
  /** Athlete setting: show the RIR selector during set entry (see
   * lib/settings/athlete-settings.ts). */
  showRir: boolean;
  /** What the big advance button reads once this exercise's sets/ride are
   * fully logged (active-workout-screen.tsx, derived from what's next). */
  advanceLabel: string;
  /** Superset display for this slot (owner's definition, 2026-09-17): null
   * when it isn't in one. `token` is the program's group letter (e.g. "A"),
   * `partnerNames` lists every OTHER member's currently-logged name,
   * `nextPartnerName` is who tapping the log button would move to right
   * now, and `isLastInGroup` is whether this is the group's last member in
   * template order (active-workout-screen.tsx). */
  supersetInfo: {
    token: string;
    partnerNames: string[];
    nextPartnerName: string | null;
    isLastInGroup: boolean;
  } | null;
  /** Overrides ExerciseEntryCard's own "Next set"/"Log set"/"Done: rep N of
   * M" wording on the button that commits the current set — set while a
   * superset partner still needs work, undefined otherwise. */
  logSetLabel?: string;
  onChoose: (exerciseId: string) => void;
  onLogSet: (set: SetLog) => void;
  onRemoveCurrentSet: () => void;
  onDeleteSet: (setNumber: number) => void;
  onAddExtraSet: () => void;
  onAdvance: () => void;
  onSkip: () => void;
  /** Reverses a skip, putting the slot back among the not-done exercises
   * (owner request 2026-09-17: undo an accidental tap, or come back once a
   * busy machine opens up). */
  onUnskip: () => void;
  onSetNote: (note: string) => void;
  onQualitativeComplete: () => void;
  onDraftChange: (draft: ExerciseSlotLog["draft"]) => void;
  reducedLoad: boolean;
  onToggleReducedLoad: () => void;
  hasSubstitution: boolean;
  onSwap: (exercise: Exercise) => void;
  onRevertSwap: () => void;
}) {
  const [swapPanelOpen, setSwapPanelOpen] = useState(false);
  const swapPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!swapPanelOpen) return;
    swapPanelRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [swapPanelOpen]);

  const prescribed = templateSlot.exercise;
  const isSkipped = slotLog.status === "skipped";

  // Small pill naming the superset group (e.g. "Superset A"), shown on both
  // the choice screen and the logging body. Kept as one shared element so
  // the two render sites can never drift in wording.
  const supersetPill = supersetInfo ? (
    <span className="inline-flex w-fit items-center rounded-full border border-accent/40 bg-accent-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent-strong">
      Superset {supersetInfo.token}
    </span>
  ) : null;

  if (!slotLog.chosenExerciseId) {
    return (
      <div className="flex flex-col gap-5">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">
          {templateSlot.section.name}
        </p>
        {supersetPill}
        <ExerciseChoiceCard
          primaryExerciseId={prescribed.exerciseId}
          alternativeExerciseIds={prescribed.alternativeExerciseIds ?? []}
          exercises={exercises}
          onChoose={onChoose}
        />
        <button
          type="button"
          onClick={isSkipped ? onUnskip : onSkip}
          className="self-start text-xs font-medium text-ink-tertiary transition-colors active:text-ink-secondary"
        >
          {isSkipped ? "Unskip" : "Skip this exercise"}
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

  // In a superset, a non-last member gets "no rest, go straight into the
  // partner" guidance instead of the normal rest line; the last member
  // keeps the normal guidance but prefixed to make clear it covers the
  // whole pair (or round, for a group of more than two) rather than just
  // this one exercise.
  const restLine = (() => {
    if (supersetInfo && !supersetInfo.isLastInGroup) {
      return `No rest here. Straight into ${supersetInfo.nextPartnerName ?? "the next exercise"}.`;
    }
    if (!restGuidance) return null;
    if (supersetInfo?.isLastInGroup) {
      const prefix = supersetInfo.partnerNames.length > 1 ? "Rest after the round" : "Rest after the pair";
      return `${prefix}: ${restGuidance.guidance}`;
    }
    return `Rest: ${restGuidance.guidance}`;
  })();

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-line-hairline bg-surface-1 p-5 shadow-card sm:p-6">
      {isSkipped ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3">
          <p className="text-sm font-medium text-ink-primary">Skipped</p>
          <button
            type="button"
            onClick={onUnskip}
            className="flex min-h-9 min-w-11 items-center justify-center rounded-full border border-line-default px-3 text-xs font-medium text-ink-secondary transition-colors active:bg-surface-2"
          >
            Unskip
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">
          {templateSlot.section.name}
        </p>
        {supersetInfo ? (
          <div className="flex flex-wrap items-center gap-2">
            {supersetPill}
            <span className="text-xs text-ink-tertiary">With {supersetInfo.partnerNames.join(" and ")}</span>
          </div>
        ) : null}
        <h1 className="font-display text-2xl font-bold leading-tight text-ink-primary sm:text-3xl">{name}</h1>
        {hasSubstitution ? (
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-tertiary">
            <span>Swapped in for {prescribedName}</span>
            <button
              type="button"
              onClick={onRevertSwap}
              className="flex min-h-9 min-w-11 items-center justify-center rounded-full border border-line-default px-3 text-xs font-medium text-ink-secondary transition-colors active:bg-surface-2"
            >
              Undo
            </button>
          </div>
        ) : null}
        {restLine ? <p className="text-xs text-ink-tertiary">{restLine}</p> : null}
        {prescribed.notes?.length ? (
          <ul className="flex flex-col gap-0.5 text-xs text-ink-tertiary">
            {prescribed.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        ) : null}
      </div>

      {chosenExercise ? <ExerciseGuidanceDisclosure exercise={chosenExercise} /> : null}

      {(prescribed.prescription.type === "qualitative" || prescribed.prescription.type === "duration") &&
      isCardioSlot(templateSlot.section, chosenExercise, prescribed.prescription) ? (
        // Cardio blocks (cycling, rowing, ...) never start on their own:
        // resistance first, then Start, Stop, readouts (owner request
        // 2026-09-04). The "Last time" panel sits above the card, exactly
        // where ExerciseEntryCard renders its own, so the number to beat
        // is visible before the ride starts.
        <div className="flex flex-col gap-5">
          <PreviousPerformanceSummary
            previousSets={previousPerformance[slotLog.chosenExerciseId]}
            prescriptionType={prescribed.prescription.type}
          />
          <CardioEntryCard
            slotLog={slotLog}
            prescription={prescribed.prescription}
            exerciseName={name}
            previousSets={previousPerformance[slotLog.chosenExerciseId]}
            advanceLabel={advanceLabel}
            onDraftChange={onDraftChange}
            onLogSet={onLogSet}
            onAdvance={onAdvance}
          />
        </div>
      ) : prescribed.prescription.type === "qualitative" ? (
        <QualitativeEntryCard prescription={prescribed.prescription} onComplete={onQualitativeComplete} />
      ) : (
        <ExerciseEntryCard
          slotLog={slotLog}
          prescription={prescribed.prescription}
          previousSets={previousPerformance[slotLog.chosenExerciseId]}
          exercise={chosenExercise}
          showRir={showRir}
          advanceLabel={advanceLabel}
          logSetLabel={logSetLabel}
          onLogSet={onLogSet}
          onRemoveCurrentSet={onRemoveCurrentSet}
          onDeleteSet={onDeleteSet}
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
            <button
              type="button"
              onClick={() => setSwapPanelOpen((prev) => !prev)}
              className="text-xs font-medium text-ink-tertiary transition-colors active:text-ink-secondary"
            >
              Swap
            </button>
            <button
              type="button"
              onClick={isSkipped ? onUnskip : onSkip}
              className="text-xs font-medium text-ink-tertiary transition-colors active:text-ink-secondary"
            >
              {isSkipped ? "Unskip" : "Skip exercise"}
            </button>
          </div>
        </div>

        {swapPanelOpen ? (
          <div ref={swapPanelRef}>
            <ExerciseSwapPicker
              sectionType={templateSlot.section.type}
              currentExercise={chosenExercise}
              prescribedName={prescribedName}
              hasSubstitution={hasSubstitution}
              onPick={(exercise) => {
                onSwap(exercise);
                setSwapPanelOpen(false);
              }}
              onRevert={() => {
                onRevertSwap();
                setSwapPanelOpen(false);
              }}
              onClose={() => setSwapPanelOpen(false)}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
