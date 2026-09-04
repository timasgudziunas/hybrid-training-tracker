"use client";

import { useState } from "react";
import type { Exercise, Prescription } from "@/lib/program/program-types";
import type { ExerciseSlotLog, SetDraft, SetLog } from "@/lib/workout-session/workout-session-types";
import { targetSetCount } from "@/lib/workout-session/slot-set-edits";
import {
  resolveRepetitionSetFields,
  hasRepetitionSetField,
  type RepetitionSetFieldKey,
  type RepetitionSetFieldSpec,
} from "@/lib/program/set-entry-fields";
import RirSelector from "./rir-selector";
import PreviousPerformanceSummary from "./previous-performance-summary";
import ProgressionSuggestion from "./progression-suggestion";

function formatRange(min: number, max: number): string {
  return min === max ? `${min}` : `${min}-${max}`;
}

type NumericFieldKey = Exclude<RepetitionSetFieldKey, "rir">;

/** Reps are always a whole number; every other repetitions field (weight,
 * box height, jump distance) accepts a decimal. */
function parseFieldValue(field: RepetitionSetFieldSpec, raw: string): number {
  return field.key === "reps" ? Number.parseInt(raw, 10) : Number.parseFloat(raw);
}

/** Carries the last-entered value forward within this session (adjacent
 * sets are almost always close in weight/height/distance); falls back to
 * last session's corresponding set, then empty ("first exposure" edge
 * case). Works for any numeric SetLog field, so box height and jump
 * distance prefill exactly like weight does. */
function prefillNumeric(committedSets: SetLog[], previousSets: SetLog[] | undefined, field: NumericFieldKey | "seconds"): string {
  const lastCommitted = committedSets[committedSets.length - 1];
  const lastValue = lastCommitted?.[field];
  if (typeof lastValue === "number") return String(lastValue);

  const setIndex = committedSets.length;
  const previous = previousSets?.[setIndex] ?? previousSets?.[previousSets.length - 1];
  const previousValue = previous?.[field];
  if (typeof previousValue === "number") return String(previousValue);

  return "";
}

/** One-line summary of an already-committed set for the compact edit list,
 * e.g. "Set 1 · 135 lb × 8 · RIR 2", "Set 1 · 24 in × 3" (box jump), or
 * "Set 1 · 3 reps" (reps-only power work). Omits pieces that were never
 * logged rather than showing a blank. */
function formatCommittedSetSummary(set: SetLog, prescription: Exclude<Prescription, { type: "qualitative" }>): string {
  if (prescription.type === "repetitions") {
    const parts: string[] = [];
    if (set.boxHeightInches !== undefined && set.reps !== undefined) {
      parts.push(`${set.boxHeightInches} in × ${set.reps}`);
    } else if (set.jumpDistanceInches !== undefined && set.reps !== undefined) {
      parts.push(`${set.jumpDistanceInches} in × ${set.reps}`);
    } else if (set.weight !== undefined && set.reps !== undefined) {
      parts.push(`${set.weight} lb × ${set.reps}`);
    } else if (set.weight !== undefined) {
      parts.push(`${set.weight} lb`);
    } else if (set.reps !== undefined) {
      parts.push(`${set.reps} reps`);
    }
    if (set.rir !== undefined) parts.push(`RIR ${set.rir}`);
    return [`Set ${set.setNumber}`, ...parts].join(" · ");
  }

  if (prescription.type === "hold" || prescription.type === "duration") {
    const parts = set.seconds !== undefined ? [`${set.seconds}s`] : [];
    return [`Set ${set.setNumber}`, ...parts].join(" · ");
  }

  // distance
  const parts = set.timeSeconds !== undefined ? [`${set.timeSeconds}s`] : set.distanceCompleted ? ["done"] : [];
  return [`Rep ${set.setNumber}`, ...parts].join(" · ");
}

function numericDraftValue(draft: SetDraft, key: NumericFieldKey): string {
  const raw = draft[key];
  return typeof raw === "string" ? raw : "";
}

/** The repetitions fields that render as plain numeric inputs (everything
 * except RIR, which gets its own tap-selector). */
function numericFieldsOf(fields: RepetitionSetFieldSpec[]): (RepetitionSetFieldSpec & { key: NumericFieldKey })[] {
  return fields.filter((field): field is RepetitionSetFieldSpec & { key: NumericFieldKey } => field.key !== "rir");
}

/**
 * Handles repetitions / hold / duration / distance prescriptions: one set
 * (or one sprint rep) entered at a time, "Next" immediately readies the
 * next set's input (PRODUCT_SPEC §6 linear execution flow). Qualitative
 * prescriptions have no per-set concept and use QualitativeEntryCard
 * instead.
 *
 * Which inputs a repetitions set shows (weight/reps/RIR, or box
 * height/reps for a box jump, or reps alone for power work) comes from
 * lib/program/set-entry-fields.ts, resolved once per exercise — never a
 * hardcoded branch here.
 *
 * The target set count (2026-09-04 rework, "removing a set removed the
 * wrong one") is prescribed sets adjusted by extraSets/removedSets via
 * targetSetCount, never a raw `prescription.sets + extraSets`. Once
 * `slotLog.sets.length` reaches that target — either by finishing the last
 * set, or because "Remove this set" shrank the target to what's already
 * logged — there is no current set to fill in: the card shows the logged
 * sets plus a "Next exercise" control instead of a "Set N of M" input.
 *
 * The parent (active-workout-screen) remounts this component (via a React
 * `key` keyed on the committed-set count) every time a set is logged or
 * deleted, so a fresh draft for the new current set would normally reset to
 * blank on that remount — `slotLog.draft` survives it instead (the
 * "left the exercise mid-entry, came back, weight was gone" bug):
 * uncommitted input values are persisted on every change via
 * `onDraftChange` and read back here as the initial state. Removing the
 * current set (which never changes `sets.length`) does not remount this
 * card, so the draft it clears is dropped deliberately by the parent
 * passing a fresh `slotLog` down, not by a key change.
 */
export default function ExerciseEntryCard({
  slotLog,
  prescription,
  exercise,
  previousSets,
  onLogSet,
  onRemoveCurrentSet,
  onDeleteSet,
  onAddExtraSet,
  onAdvance,
  onDraftChange,
}: {
  slotLog: ExerciseSlotLog;
  prescription: Exclude<Prescription, { type: "qualitative" }>;
  exercise: Exercise | undefined;
  previousSets: SetLog[] | undefined;
  onLogSet: (set: SetLog) => void;
  onRemoveCurrentSet: () => void;
  onDeleteSet: (setNumber: number) => void;
  onAddExtraSet: () => void;
  onAdvance: () => void;
  onDraftChange: (draft: SetDraft) => void;
}) {
  const fields = resolveRepetitionSetFields(exercise);
  const targetSets = targetSetCount(prescription.sets, slotLog);
  const currentSetNumber = slotLog.sets.length + 1;
  const allSetsLogged = slotLog.sets.length >= targetSets;
  const perSideLabel = "perSide" in prescription && prescription.perSide ? " (each side)" : "";

  const [draft, setDraft] = useState<SetDraft>(() => {
    if (slotLog.draft) return { ...slotLog.draft };

    const initial: SetDraft = {};
    if (prescription.type === "repetitions") {
      if (hasRepetitionSetField(fields, "weight")) {
        initial.weight = prefillNumeric(slotLog.sets, previousSets, "weight");
      }
      if (hasRepetitionSetField(fields, "boxHeightInches")) {
        initial.boxHeightInches = prefillNumeric(slotLog.sets, previousSets, "boxHeightInches");
      }
      if (hasRepetitionSetField(fields, "jumpDistanceInches")) {
        initial.jumpDistanceInches = prefillNumeric(slotLog.sets, previousSets, "jumpDistanceInches");
      }
    } else if (prescription.type === "hold" || prescription.type === "duration") {
      initial.seconds = prefillNumeric(slotLog.sets, previousSets, "seconds") || String(prescription.maxSeconds);
    }
    return initial;
  });

  // Which already-committed set (1-based) is being corrected, if any. While
  // editing, the current-set draft above is left untouched (rendered but
  // not shown) — a separate EditSetForm instance owns its own local state,
  // so editing an earlier set can never clobber a draft in progress for the
  // set currently being entered.
  const [editingSetNumber, setEditingSetNumber] = useState<number | null>(null);

  function updateDraft<K extends keyof SetDraft>(key: K, value: SetDraft[K]) {
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      onDraftChange(next);
      return next;
    });
  }

  function commitAndAdvance(set: SetLog) {
    onLogSet(set);
    if (currentSetNumber >= targetSets) {
      onAdvance();
    }
  }

  function buildRepetitionSet(): SetLog {
    const set: SetLog = { setNumber: currentSetNumber, completed: true };
    for (const field of fields) {
      if (field.key === "rir") {
        set.rir = draft.rir;
        continue;
      }
      const raw = numericDraftValue(draft, field.key);
      if (raw) set[field.key] = parseFieldValue(field, raw);
    }
    return set;
  }

  const rangeLabel =
    prescription.type === "repetitions"
      ? `${formatRange(prescription.minReps, prescription.maxReps)} reps`
      : prescription.type === "hold" || prescription.type === "duration"
        ? `${formatRange(prescription.minSeconds, prescription.maxSeconds)} sec`
        : `${prescription.meters} m`;

  const numericFields = numericFieldsOf(fields);
  const showRir = hasRepetitionSetField(fields, "rir");
  const showProgressionSuggestion = hasRepetitionSetField(fields, "weight") || prescription.type !== "repetitions";

  return (
    <div className="flex flex-col gap-5">
      <PreviousPerformanceSummary previousSets={previousSets} prescriptionType={prescription.type} />

      {showProgressionSuggestion ? (
        <ProgressionSuggestion
          prescription={prescription}
          previousSets={previousSets}
          onUseWeight={(value) => updateDraft("weight", String(value))}
          onUseSeconds={(value) => updateDraft("seconds", String(value))}
        />
      ) : null}

      {slotLog.sets.length > 0 ? (
        <div className="flex flex-col gap-1">
          {slotLog.sets.map((set) => (
            <button
              key={set.setNumber}
              type="button"
              onClick={() => setEditingSetNumber(set.setNumber)}
              className="flex items-center justify-between rounded-lg px-2 py-2 text-left text-sm text-ink-secondary transition-colors active:bg-surface-2"
            >
              <span>{formatCommittedSetSummary(set, prescription)}</span>
              <span className="text-xs font-medium text-ink-tertiary">Edit</span>
            </button>
          ))}
        </div>
      ) : null}

      {editingSetNumber !== null ? (
        <EditSetForm
          key={editingSetNumber}
          prescription={prescription}
          fields={fields}
          set={slotLog.sets[editingSetNumber - 1]}
          onSave={(set) => {
            onLogSet(set);
            setEditingSetNumber(null);
          }}
          onDelete={() => {
            onDeleteSet(editingSetNumber);
            setEditingSetNumber(null);
          }}
          onCancel={() => setEditingSetNumber(null)}
        />
      ) : allSetsLogged ? (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onAdvance}
            className="h-16 rounded-xl bg-accent text-lg font-semibold text-accent-ink shadow-card transition-colors active:bg-accent-strong"
          >
            Next exercise
          </button>
          <button
            type="button"
            onClick={onAddExtraSet}
            className="self-start rounded-lg border border-line-default px-3 py-2 text-xs font-medium text-ink-secondary transition-colors active:bg-surface-2"
          >
            + Add set
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-baseline justify-between">
            <p className="font-display text-xl font-semibold tabular-nums text-ink-primary">
              Set {currentSetNumber} <span className="text-ink-tertiary">of {targetSets}</span>
              {perSideLabel}
            </p>
            <p className="text-xs text-ink-tertiary">Target: {rangeLabel}</p>
          </div>

          {prescription.type === "repetitions" ? (
            <div className="flex flex-col gap-4">
              {numericFields.length > 0 ? (
                <div className={numericFields.length > 1 ? "grid grid-cols-2 gap-3" : "flex flex-col gap-3"}>
                  {numericFields.map((field) => (
                    <label key={field.key} className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">{field.label}</span>
                      <input
                        type="text"
                        inputMode={field.inputMode}
                        value={numericDraftValue(draft, field.key)}
                        onChange={(e) => updateDraft(field.key, e.target.value)}
                        className="h-16 rounded-xl border border-line-default bg-surface-2 px-4 font-display text-3xl tabular-nums text-ink-primary shadow-well transition-colors focus:border-accent focus:outline-none"
                        placeholder={field.key === "reps" ? formatRange(prescription.minReps, prescription.maxReps) : "0"}
                        autoFocus={field.key === "reps"}
                      />
                    </label>
                  ))}
                </div>
              ) : null}
              {showRir ? (
                <RirSelector value={draft.rir} onChange={(value) => updateDraft("rir", value)} />
              ) : null}
              <button
                type="button"
                onClick={() => commitAndAdvance(buildRepetitionSet())}
                className="h-16 rounded-xl bg-accent text-lg font-semibold text-accent-ink shadow-card transition-colors active:bg-accent-strong"
              >
                Next
              </button>
            </div>
          ) : null}

          {prescription.type === "hold" || prescription.type === "duration" ? (
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">Seconds achieved</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={draft.seconds ?? ""}
                  onChange={(e) => updateDraft("seconds", e.target.value)}
                  className="h-16 rounded-xl border border-line-default bg-surface-2 px-4 font-display text-3xl tabular-nums text-ink-primary shadow-well transition-colors focus:border-accent focus:outline-none"
                  autoFocus
                />
              </label>
              <button
                type="button"
                onClick={() =>
                  commitAndAdvance({
                    setNumber: currentSetNumber,
                    completed: true,
                    seconds: draft.seconds ? Number.parseInt(draft.seconds, 10) : undefined,
                  })
                }
                className="h-16 rounded-xl bg-accent text-lg font-semibold text-accent-ink shadow-card transition-colors active:bg-accent-strong"
              >
                Next
              </button>
            </div>
          ) : null}

          {prescription.type === "distance" ? (
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">
                  Time (sec), optional
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={draft.timeSeconds ?? ""}
                  onChange={(e) => updateDraft("timeSeconds", e.target.value)}
                  className="h-14 rounded-xl border border-line-default bg-surface-2 px-4 font-display text-2xl tabular-nums text-ink-primary shadow-well transition-colors focus:border-accent focus:outline-none"
                />
              </label>
              <button
                type="button"
                onClick={() =>
                  commitAndAdvance({
                    setNumber: currentSetNumber,
                    completed: true,
                    distanceCompleted: true,
                    timeSeconds: draft.timeSeconds ? Number.parseFloat(draft.timeSeconds) : undefined,
                  })
                }
                className="h-16 rounded-xl bg-accent text-lg font-semibold text-accent-ink shadow-card transition-colors active:bg-accent-strong"
              >
                Done: rep {currentSetNumber} of {targetSets}
              </button>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={onAddExtraSet}
              className="rounded-lg border border-line-default px-3 py-2 text-xs font-medium text-ink-secondary transition-colors active:bg-surface-2"
            >
              + Add set
            </button>
            <button
              type="button"
              onClick={() => {
                // removeCurrentSet clears the persisted draft, but this
                // action never changes slotLog.sets.length, so the parent
                // (keyed on committed-set count) will not remount this
                // card to pick that up. Clear the local draft state here,
                // in the same tick as the action, so the inputs actually go
                // blank instead of keeping stale typed values on screen.
                setDraft({});
                onRemoveCurrentSet();
              }}
              className="rounded-lg border border-line-default px-3 py-2 text-xs font-medium text-ink-secondary transition-colors active:bg-surface-2"
            >
              &minus; Remove this set
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Correction form for one already-committed set (item H: "edit a previous
 * set"). Deliberately a separate component with its own local state rather
 * than reusing ExerciseEntryCard's draft — the parent doesn't remount on
 * entering/leaving edit mode (it's keyed on `sets.length`, which doesn't
 * change while editing), so sharing state would let editing an earlier set
 * clobber the in-progress draft for the current new set. On save, calls
 * back with the set fully re-specified and `completed: true`; never
 * advances the slot (correcting set 2 of 4 must not behave like finishing
 * the exercise). "Delete set" (owner request: "I can't delete a set after
 * saving it") calls `onDelete` instead, with no confirmation dialog
 * (product rule: no unnecessary confirmations) but styled distinctly from
 * "Save set" so it can't be tapped by accident.
 */
function EditSetForm({
  prescription,
  fields,
  set,
  onSave,
  onDelete,
  onCancel,
}: {
  prescription: Exclude<Prescription, { type: "qualitative" }>;
  fields: RepetitionSetFieldSpec[];
  set: SetLog;
  onSave: (set: SetLog) => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const numericFields = numericFieldsOf(fields);
  const showRir = hasRepetitionSetField(fields, "rir");

  const [values, setValues] = useState<Record<NumericFieldKey, string>>(() => {
    const initial = {} as Record<NumericFieldKey, string>;
    for (const field of numericFields) {
      const raw = set[field.key];
      initial[field.key] = raw !== undefined ? String(raw) : "";
    }
    return initial;
  });
  const [rir, setRir] = useState<number | undefined>(set.rir);
  const [seconds, setSeconds] = useState(() => (set.seconds !== undefined ? String(set.seconds) : ""));
  const [timeSeconds, setTimeSeconds] = useState(() => (set.timeSeconds !== undefined ? String(set.timeSeconds) : ""));

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line-default bg-surface-2/60 p-4">
      <div className="flex items-center justify-between">
        <p className="font-display text-lg font-semibold text-ink-primary">Editing set {set.setNumber}</p>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-medium text-ink-tertiary transition-colors active:text-ink-secondary"
        >
          Cancel
        </button>
      </div>

      {prescription.type === "repetitions" ? (
        <div className="flex flex-col gap-4">
          {numericFields.length > 0 ? (
            <div className={numericFields.length > 1 ? "grid grid-cols-2 gap-3" : "flex flex-col gap-3"}>
              {numericFields.map((field) => (
                <label key={field.key} className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">{field.label}</span>
                  <input
                    type="text"
                    inputMode={field.inputMode}
                    value={values[field.key]}
                    onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="h-14 rounded-xl border border-line-default bg-surface-2 px-4 font-display text-2xl tabular-nums text-ink-primary shadow-well transition-colors focus:border-accent focus:outline-none"
                    placeholder="0"
                  />
                </label>
              ))}
            </div>
          ) : null}
          {showRir ? <RirSelector value={rir} onChange={setRir} /> : null}
        </div>
      ) : null}

      {prescription.type === "hold" || prescription.type === "duration" ? (
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">Seconds achieved</span>
          <input
            type="text"
            inputMode="numeric"
            value={seconds}
            onChange={(e) => setSeconds(e.target.value)}
            className="h-14 rounded-xl border border-line-default bg-surface-2 px-4 font-display text-2xl tabular-nums text-ink-primary shadow-well transition-colors focus:border-accent focus:outline-none"
          />
        </label>
      ) : null}

      {prescription.type === "distance" ? (
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">Time (sec), optional</span>
          <input
            type="text"
            inputMode="decimal"
            value={timeSeconds}
            onChange={(e) => setTimeSeconds(e.target.value)}
            className="h-14 rounded-xl border border-line-default bg-surface-2 px-4 font-display text-2xl tabular-nums text-ink-primary shadow-well transition-colors focus:border-accent focus:outline-none"
          />
        </label>
      ) : null}

      <button
        type="button"
        onClick={() => {
          const built: SetLog = { setNumber: set.setNumber, completed: true };
          if (prescription.type === "repetitions") {
            for (const field of numericFields) {
              const raw = values[field.key];
              if (raw) built[field.key] = parseFieldValue(field, raw);
            }
            if (showRir) built.rir = rir;
          }
          if (prescription.type === "hold" || prescription.type === "duration") {
            built.seconds = seconds ? Number.parseInt(seconds, 10) : undefined;
          }
          if (prescription.type === "distance") {
            built.distanceCompleted = true;
            built.timeSeconds = timeSeconds ? Number.parseFloat(timeSeconds) : undefined;
          }
          onSave(built);
        }}
        className="h-14 rounded-xl bg-accent text-base font-semibold text-accent-ink shadow-card transition-colors active:bg-accent-strong"
      >
        Save set
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="h-11 rounded-xl border border-danger/40 text-sm font-medium text-danger transition-colors active:bg-danger-soft"
      >
        Delete set
      </button>
    </div>
  );
}
