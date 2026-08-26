"use client";

import { useState } from "react";
import type { Prescription } from "@/lib/program/program-types";
import type { ExerciseSlotLog, SetLog } from "@/lib/workout-session/workout-session-types";
import RirSelector from "./rir-selector";
import PreviousPerformanceSummary from "./previous-performance-summary";
import ProgressionSuggestion from "./progression-suggestion";

type Draft = NonNullable<ExerciseSlotLog["draft"]>;

function formatRange(min: number, max: number): string {
  return min === max ? `${min}` : `${min}-${max}`;
}

/** Carries the last-entered value forward within this session (adjacent
 * sets are almost always the same weight/hold time); falls back to last
 * session's corresponding set, then empty ("first exposure" edge case). */
function prefillNumeric(
  committedSets: SetLog[],
  previousSets: SetLog[] | undefined,
  field: "weight" | "seconds"
): string {
  const lastCommitted = committedSets[committedSets.length - 1];
  if (lastCommitted?.[field] !== undefined) return String(lastCommitted[field]);

  const setIndex = committedSets.length;
  const previous = previousSets?.[setIndex] ?? previousSets?.[previousSets.length - 1];
  if (previous?.[field] !== undefined) return String(previous[field]);

  return "";
}

/** One-line summary of an already-committed set for the compact edit list,
 * e.g. "Set 1 · 135 lb × 8 · RIR 2" or "Rep 1 · 5.2s". Omits pieces that
 * were never logged rather than showing a blank. */
function formatCommittedSetSummary(set: SetLog, prescription: Exclude<Prescription, { type: "qualitative" }>): string {
  if (prescription.type === "repetitions") {
    const parts: string[] = [];
    if (set.weight !== undefined && set.reps !== undefined) {
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

/**
 * Handles repetitions / hold / duration / distance prescriptions: one set
 * (or one sprint rep) entered at a time, "Next" immediately readies the
 * next set's input (PRODUCT_SPEC §6 linear execution flow). Qualitative
 * prescriptions have no per-set concept and use QualitativeEntryCard
 * instead.
 *
 * The parent (active-workout-screen) remounts this component (via a React
 * `key` keyed on the committed-set count) every time a set is logged or
 * removed, so a fresh draft for the new current set would normally reset to
 * blank on that remount — `slotLog.draft` survives it instead (the
 * "left the exercise mid-entry, came back, weight was gone" bug):
 * uncommitted input values are persisted on every change via
 * `onDraftChange` and read back here as the initial state.
 */
export default function ExerciseEntryCard({
  slotLog,
  prescription,
  previousSets,
  onLogSet,
  onRemoveLastSet,
  onAddExtraSet,
  onAdvance,
  onDraftChange,
}: {
  slotLog: ExerciseSlotLog;
  prescription: Exclude<Prescription, { type: "qualitative" }>;
  previousSets: SetLog[] | undefined;
  onLogSet: (set: SetLog) => void;
  onRemoveLastSet: () => void;
  onAddExtraSet: () => void;
  onAdvance: () => void;
  onDraftChange: (draft: Draft) => void;
}) {
  const targetSets = prescription.sets + (slotLog.extraSets ?? 0);
  const currentSetNumber = slotLog.sets.length + 1;
  const perSideLabel = "perSide" in prescription && prescription.perSide ? " (each side)" : "";

  const [weight, setWeight] = useState(() => {
    if (prescription.type !== "repetitions") return "";
    if (slotLog.draft?.weight !== undefined) return slotLog.draft.weight;
    return prefillNumeric(slotLog.sets, previousSets, "weight");
  });
  const [reps, setReps] = useState(() => slotLog.draft?.reps ?? "");
  const [rir, setRir] = useState<number | undefined>(() => slotLog.draft?.rir);
  const [seconds, setSeconds] = useState(() => {
    if (prescription.type !== "hold" && prescription.type !== "duration") return "";
    if (slotLog.draft?.seconds !== undefined) return slotLog.draft.seconds;
    return prefillNumeric(slotLog.sets, previousSets, "seconds") || String(prescription.maxSeconds);
  });
  const [timeSeconds, setTimeSeconds] = useState(() => slotLog.draft?.timeSeconds ?? "");

  // Which already-committed set (1-based) is being corrected, if any. While
  // editing, the current-set inputs above are left untouched (rendered but
  // not shown) — a separate EditSetForm instance owns its own local state,
  // so editing an earlier set can never clobber a draft in progress for the
  // set currently being entered.
  const [editingSetNumber, setEditingSetNumber] = useState<number | null>(null);

  function emitDraft(overrides: Partial<Draft>) {
    onDraftChange({ weight, reps, rir, seconds, timeSeconds, ...overrides });
  }

  function commitAndAdvance(set: SetLog) {
    onLogSet(set);
    if (currentSetNumber >= targetSets) {
      onAdvance();
    }
  }

  const rangeLabel =
    prescription.type === "repetitions"
      ? `${formatRange(prescription.minReps, prescription.maxReps)} reps`
      : prescription.type === "hold" || prescription.type === "duration"
        ? `${formatRange(prescription.minSeconds, prescription.maxSeconds)} sec`
        : `${prescription.meters} m`;

  return (
    <div className="flex flex-col gap-5">
      <PreviousPerformanceSummary previousSets={previousSets} prescriptionType={prescription.type} />

      <ProgressionSuggestion
        prescription={prescription}
        previousSets={previousSets}
        onUseWeight={(value) => {
          setWeight(String(value));
          emitDraft({ weight: String(value) });
        }}
        onUseSeconds={(value) => {
          setSeconds(String(value));
          emitDraft({ seconds: String(value) });
        }}
      />

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
          set={slotLog.sets[editingSetNumber - 1]}
          onSave={(set) => {
            onLogSet(set);
            setEditingSetNumber(null);
          }}
          onCancel={() => setEditingSetNumber(null)}
        />
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
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">Weight (lb)</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={weight}
                    onChange={(e) => {
                      setWeight(e.target.value);
                      emitDraft({ weight: e.target.value });
                    }}
                    className="h-16 rounded-xl border border-line-default bg-surface-2 px-4 font-display text-3xl tabular-nums text-ink-primary shadow-well transition-colors focus:border-accent focus:outline-none"
                    placeholder="0"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">Reps</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={reps}
                    onChange={(e) => {
                      setReps(e.target.value);
                      emitDraft({ reps: e.target.value });
                    }}
                    className="h-16 rounded-xl border border-line-default bg-surface-2 px-4 font-display text-3xl tabular-nums text-ink-primary shadow-well transition-colors focus:border-accent focus:outline-none"
                    placeholder={formatRange(prescription.minReps, prescription.maxReps)}
                    autoFocus
                  />
                </label>
              </div>
              <RirSelector
                value={rir}
                onChange={(value) => {
                  setRir(value);
                  emitDraft({ rir: value });
                }}
              />
              <button
                type="button"
                onClick={() =>
                  commitAndAdvance({
                    setNumber: currentSetNumber,
                    completed: true,
                    weight: weight ? Number.parseFloat(weight) : undefined,
                    reps: reps ? Number.parseInt(reps, 10) : undefined,
                    rir,
                  })
                }
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
                  value={seconds}
                  onChange={(e) => {
                    setSeconds(e.target.value);
                    emitDraft({ seconds: e.target.value });
                  }}
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
                    seconds: seconds ? Number.parseInt(seconds, 10) : undefined,
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
                  value={timeSeconds}
                  onChange={(e) => {
                    setTimeSeconds(e.target.value);
                    emitDraft({ timeSeconds: e.target.value });
                  }}
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
                    timeSeconds: timeSeconds ? Number.parseFloat(timeSeconds) : undefined,
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
            {slotLog.sets.length > 0 ? (
              <button
                type="button"
                onClick={onRemoveLastSet}
                className="rounded-lg border border-line-default px-3 py-2 text-xs font-medium text-ink-secondary transition-colors active:bg-surface-2"
              >
                &minus; Remove set
              </button>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Correction form for one already-committed set (item H: "edit a previous
 * set"). Deliberately a separate component with its own local state rather
 * than reusing ExerciseEntryCard's weight/reps/rir/seconds/timeSeconds —
 * the parent doesn't remount on entering/leaving edit mode (it's keyed on
 * `sets.length`, which doesn't change while editing), so sharing state would
 * let editing an earlier set clobber the in-progress draft for the current
 * new set. On save, calls back with the set fully re-specified and
 * `completed: true`; never advances the slot (correcting set 2 of 4 must not
 * behave like finishing the exercise).
 */
function EditSetForm({
  prescription,
  set,
  onSave,
  onCancel,
}: {
  prescription: Exclude<Prescription, { type: "qualitative" }>;
  set: SetLog;
  onSave: (set: SetLog) => void;
  onCancel: () => void;
}) {
  const [weight, setWeight] = useState(() => (set.weight !== undefined ? String(set.weight) : ""));
  const [reps, setReps] = useState(() => (set.reps !== undefined ? String(set.reps) : ""));
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
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">Weight (lb)</span>
              <input
                type="text"
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="h-14 rounded-xl border border-line-default bg-surface-2 px-4 font-display text-2xl tabular-nums text-ink-primary shadow-well transition-colors focus:border-accent focus:outline-none"
                placeholder="0"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">Reps</span>
              <input
                type="text"
                inputMode="numeric"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="h-14 rounded-xl border border-line-default bg-surface-2 px-4 font-display text-2xl tabular-nums text-ink-primary shadow-well transition-colors focus:border-accent focus:outline-none"
              />
            </label>
          </div>
          <RirSelector value={rir} onChange={setRir} />
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
        onClick={() =>
          onSave({
            setNumber: set.setNumber,
            completed: true,
            weight: prescription.type === "repetitions" && weight ? Number.parseFloat(weight) : undefined,
            reps: prescription.type === "repetitions" && reps ? Number.parseInt(reps, 10) : undefined,
            rir: prescription.type === "repetitions" ? rir : undefined,
            seconds:
              (prescription.type === "hold" || prescription.type === "duration") && seconds
                ? Number.parseInt(seconds, 10)
                : undefined,
            distanceCompleted: prescription.type === "distance" ? true : undefined,
            timeSeconds: prescription.type === "distance" && timeSeconds ? Number.parseFloat(timeSeconds) : undefined,
          })
        }
        className="h-14 rounded-xl bg-accent text-base font-semibold text-accent-ink shadow-card transition-colors active:bg-accent-strong"
      >
        Save set
      </button>
    </div>
  );
}
