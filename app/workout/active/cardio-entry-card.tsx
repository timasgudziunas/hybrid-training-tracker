"use client";

import { useEffect, useState } from "react";
import type { DurationPrescription, Prescription, QualitativePrescription } from "@/lib/program/program-types";
import type { ExerciseSlotLog, SetDraft, SetLog } from "@/lib/workout-session/workout-session-types";
import { cardioTargetLabel, cardioVerbFor } from "@/lib/workout-session/cardio-slot";
import { formatLoggedSet } from "@/lib/workout-session/format-logged-set";

const LABEL_CLASS = "text-[11px] font-medium uppercase tracking-widest text-ink-tertiary";
const INPUT_CLASS =
  "h-16 rounded-xl border border-line-default bg-surface-2 px-4 font-display text-3xl tabular-nums text-ink-primary shadow-well transition-colors focus:border-accent focus:outline-none";
const PRIMARY_BUTTON_CLASS =
  "h-16 rounded-xl bg-accent text-lg font-semibold text-accent-ink shadow-card transition-colors active:bg-accent-strong";

/** Formats whole seconds as M:SS. Duplicated from session-timer.tsx /
 * exercise-timer.tsx's own small formatter rather than shared, same
 * rationale as those two: a single small pure function with no other
 * coupling. */
function formatElapsed(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

function parseOptionalFloat(value: string): number | undefined {
  if (value.trim().length === 0) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

/** "Level 8" for a bare number, "Resistance L8" (etc) otherwise, so the
 * running-state label reads cleanly whatever the machine calls its dial. */
function resistanceDisplayLabel(resistance: string): string {
  const trimmed = resistance.trim();
  const isPurelyNumeric = /^\d+(\.\d+)?$/.test(trimmed);
  return isPurelyNumeric ? `Level ${trimmed}` : `Resistance ${trimmed}`;
}

/**
 * Cardio blocks (cycling, rowing, running, and similar machine work) get a
 * three-state flow instead of the generic qualitative "mark complete" tap
 * or a single-set duration entry (owner request, 2026-09-04): set the
 * resistance, start the clock, then enter the machine's readouts at the
 * end so the next time the same activity comes up there is a concrete
 * number to beat. State is driven only by persisted data (`slotLog.draft`
 * and `slotLog.sets[0]`, both mirrored to localStorage by the parent) so a
 * refresh lands back in exactly the same place — see the SetDraft doc in
 * workout-session-types.ts. `editing` is the one piece of local-only state:
 * reopening the Results form to correct a logged ride is a UI convenience,
 * not something a refresh needs to preserve.
 */
export default function CardioEntryCard({
  slotLog,
  prescription,
  exerciseName,
  previousSets,
  onDraftChange,
  onLogSet,
  onAdvance,
}: {
  slotLog: ExerciseSlotLog;
  prescription: QualitativePrescription | DurationPrescription;
  exerciseName: string;
  previousSets: SetLog[] | undefined;
  onDraftChange: (draft: SetDraft) => void;
  onLogSet: (set: SetLog) => void;
  onAdvance: () => void;
}) {
  const draft: SetDraft = slotLog.draft ?? {};
  const loggedSet = slotLog.sets[0] as SetLog | undefined;
  const previousSet = previousSets?.[0];
  const [editing, setEditing] = useState(false);

  if (loggedSet && !editing) {
    return (
      <LoggedState
        loggedSet={loggedSet}
        prescriptionType={prescription.type}
        onAdvance={onAdvance}
        onEdit={() => setEditing(true)}
      />
    );
  }

  if (draft.cardioStartedAt && !draft.cardioEndedAt) {
    return (
      <RunningState
        cardioStartedAt={draft.cardioStartedAt}
        resistance={draft.resistance}
        onStop={() => onDraftChange({ ...draft, cardioEndedAt: new Date().toISOString() })}
        onRestart={() => onDraftChange({ ...draft, cardioStartedAt: undefined, cardioEndedAt: undefined })}
      />
    );
  }

  if (draft.cardioEndedAt || editing) {
    return (
      <ResultsState
        draft={draft}
        loggedSet={editing ? loggedSet : undefined}
        previousSet={previousSet}
        prescriptionType={prescription.type}
        // A fresh Results screen (Stop was just tapped) can go back to the
        // running clock: clearing cardioEndedAt resumes from the original
        // start, so an accidental Stop costs nothing. Editing a logged
        // ride cancels back to the logged view instead.
        onCancel={editing ? () => setEditing(false) : () => onDraftChange({ ...draft, cardioEndedAt: undefined })}
        cancelLabel={editing ? "Cancel" : "Resume timer"}
        title={editing ? "Editing logged ride" : "Ride done"}
        onDraftChange={onDraftChange}
        onSave={(set) => {
          onLogSet(set);
          setEditing(false);
          onDraftChange({
            ...draft,
            cardioStartedAt: undefined,
            cardioEndedAt: undefined,
            resistance: undefined,
            averageWatts: undefined,
            averageSpeedMph: undefined,
            distanceMiles: undefined,
            seconds: undefined,
          });
          onAdvance();
        }}
      />
    );
  }

  return (
    <SetupState
      prescription={prescription}
      resistance={draft.resistance ?? previousSet?.resistance ?? ""}
      verb={cardioVerbFor(exerciseName)}
      onResistanceChange={(resistance) => onDraftChange({ ...draft, resistance })}
      onStart={(resistance) => onDraftChange({ ...draft, resistance, cardioStartedAt: new Date().toISOString() })}
    />
  );
}

function SetupState({
  prescription,
  resistance,
  verb,
  onResistanceChange,
  onStart,
}: {
  prescription: QualitativePrescription | DurationPrescription;
  resistance: string;
  verb: string;
  onResistanceChange: (resistance: string) => void;
  onStart: (resistance: string) => void;
}) {
  const targetLabel = cardioTargetLabel(prescription);

  return (
    <div className="flex flex-col gap-4">
      {prescription.type === "qualitative" ? <p className="text-sm text-ink-secondary">{prescription.description}</p> : null}
      {targetLabel ? <p className="text-xs text-ink-tertiary">{targetLabel}</p> : null}

      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Resistance</span>
        <input
          type="text"
          inputMode="decimal"
          value={resistance}
          onChange={(e) => onResistanceChange(e.target.value)}
          placeholder="Level"
          className={INPUT_CLASS}
        />
      </label>

      <button type="button" onClick={() => onStart(resistance)} className={PRIMARY_BUTTON_CLASS}>
        Start {verb}
      </button>
    </div>
  );
}

function RunningState({
  cardioStartedAt,
  resistance,
  onStop,
  onRestart,
}: {
  cardioStartedAt: string;
  resistance: string | undefined;
  onStop: () => void;
  onRestart: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const elapsedSeconds = (now - new Date(cardioStartedAt).getTime()) / 1000;
  const resistanceLabel = resistance && resistance.trim().length > 0 ? resistanceDisplayLabel(resistance) : null;

  return (
    <div className="flex flex-col items-center gap-6 py-2">
      <span className="font-display text-6xl font-bold tabular-nums text-ink-primary" aria-label="Elapsed time">
        {formatElapsed(elapsedSeconds)}
      </span>
      {resistanceLabel ? <p className="text-xs text-ink-tertiary">{resistanceLabel}</p> : null}
      <button type="button" onClick={onStop} className={`${PRIMARY_BUTTON_CLASS} w-full`}>
        Stop
      </button>
      <button
        type="button"
        onClick={onRestart}
        className="text-xs font-medium text-ink-tertiary transition-colors active:text-ink-secondary"
      >
        Restart
      </button>
    </div>
  );
}

function ResultsState({
  draft,
  loggedSet,
  previousSet,
  prescriptionType,
  onCancel,
  cancelLabel,
  title,
  onDraftChange,
  onSave,
}: {
  draft: SetDraft;
  loggedSet: SetLog | undefined;
  previousSet: SetLog | undefined;
  prescriptionType: Prescription["type"];
  onCancel: () => void;
  cancelLabel: string;
  title: string;
  onDraftChange: (draft: SetDraft) => void;
  onSave: (set: SetLog) => void;
}) {
  const [minutes, setMinutes] = useState(() => {
    if (loggedSet) return loggedSet.seconds !== undefined ? (loggedSet.seconds / 60).toFixed(1) : "";
    if (draft.seconds !== undefined) return draft.seconds;
    if (draft.cardioStartedAt && draft.cardioEndedAt) {
      const elapsedMs = new Date(draft.cardioEndedAt).getTime() - new Date(draft.cardioStartedAt).getTime();
      return (Math.max(0, elapsedMs) / 60000).toFixed(1);
    }
    return "";
  });
  const [resistance, setResistance] = useState(() => (loggedSet ? (loggedSet.resistance ?? "") : (draft.resistance ?? "")));
  const [watts, setWatts] = useState(() =>
    loggedSet ? (loggedSet.averageWatts !== undefined ? String(loggedSet.averageWatts) : "") : (draft.averageWatts ?? "")
  );
  const [speed, setSpeed] = useState(() =>
    loggedSet
      ? loggedSet.averageSpeedMph !== undefined
        ? String(loggedSet.averageSpeedMph)
        : ""
      : (draft.averageSpeedMph ?? "")
  );
  const [distance, setDistance] = useState(() =>
    loggedSet
      ? loggedSet.distanceMiles !== undefined
        ? String(loggedSet.distanceMiles)
        : ""
      : (draft.distanceMiles ?? "")
  );

  function emitDraft(overrides: Partial<SetDraft>) {
    onDraftChange({
      ...draft,
      seconds: minutes,
      resistance,
      averageWatts: watts,
      averageSpeedMph: speed,
      distanceMiles: distance,
      ...overrides,
    });
  }

  const previousLine = previousSet ? formatLoggedSet(previousSet, prescriptionType) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="font-display text-lg font-semibold text-ink-primary">{title}</p>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-medium text-ink-tertiary transition-colors active:text-ink-secondary"
        >
          {cancelLabel}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS}>Time (min)</span>
          <input
            type="text"
            inputMode="decimal"
            value={minutes}
            onChange={(e) => {
              setMinutes(e.target.value);
              emitDraft({ seconds: e.target.value });
            }}
            className={INPUT_CLASS}
            autoFocus
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS}>Resistance</span>
          <input
            type="text"
            inputMode="decimal"
            value={resistance}
            onChange={(e) => {
              setResistance(e.target.value);
              emitDraft({ resistance: e.target.value });
            }}
            className={INPUT_CLASS}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS}>Avg watts</span>
          <input
            type="text"
            inputMode="numeric"
            value={watts}
            onChange={(e) => {
              setWatts(e.target.value);
              emitDraft({ averageWatts: e.target.value });
            }}
            className={INPUT_CLASS}
            placeholder="Optional"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS}>Avg speed (mph)</span>
          <input
            type="text"
            inputMode="decimal"
            value={speed}
            onChange={(e) => {
              setSpeed(e.target.value);
              emitDraft({ averageSpeedMph: e.target.value });
            }}
            className={INPUT_CLASS}
            placeholder="Optional"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Distance (mi)</span>
        <input
          type="text"
          inputMode="decimal"
          value={distance}
          onChange={(e) => {
            setDistance(e.target.value);
            emitDraft({ distanceMiles: e.target.value });
          }}
          className={INPUT_CLASS}
          placeholder="Optional"
        />
      </label>

      {previousLine ? <p className="text-xs text-ink-tertiary">Last time: {previousLine}</p> : null}

      <button
        type="button"
        onClick={() => {
          const minutesValue = parseOptionalFloat(minutes) ?? 0;
          const trimmedResistance = resistance.trim();
          onSave({
            setNumber: 1,
            completed: true,
            seconds: Math.round(minutesValue * 60),
            resistance: trimmedResistance.length > 0 ? trimmedResistance : undefined,
            averageWatts: parseOptionalFloat(watts),
            averageSpeedMph: parseOptionalFloat(speed),
            distanceMiles: parseOptionalFloat(distance),
          });
        }}
        className={PRIMARY_BUTTON_CLASS}
      >
        Save and next
      </button>
    </div>
  );
}

function LoggedState({
  loggedSet,
  prescriptionType,
  onAdvance,
  onEdit,
}: {
  loggedSet: SetLog;
  prescriptionType: Prescription["type"];
  onAdvance: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 rounded-xl border border-line-hairline bg-surface-2 px-4 py-3">
        <p className={LABEL_CLASS}>Logged</p>
        <p className="font-display text-lg font-semibold tabular-nums text-ink-secondary">
          {formatLoggedSet(loggedSet, prescriptionType)}
        </p>
      </div>
      <button type="button" onClick={onAdvance} className={PRIMARY_BUTTON_CLASS}>
        Next exercise
      </button>
      <button
        type="button"
        onClick={onEdit}
        className="self-start text-xs font-medium text-ink-tertiary transition-colors active:text-ink-secondary"
      >
        Edit
      </button>
    </div>
  );
}
