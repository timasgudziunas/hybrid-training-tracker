"use client";

import { useState } from "react";
import type { Prescription } from "@/lib/program/program-types";
import type { ExerciseSlotLog, SetLog } from "@/lib/workout-session/workout-session-types";
import RirSelector from "./rir-selector";
import PreviousPerformanceSummary from "./previous-performance-summary";
import ProgressionSuggestion from "./progression-suggestion";

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

/**
 * Handles repetitions / hold / duration / distance prescriptions: one set
 * (or one sprint rep) entered at a time, "Next" immediately readies the
 * next set's input (PRODUCT_SPEC §6 linear execution flow). Qualitative
 * prescriptions have no per-set concept and use QualitativeEntryCard
 * instead.
 *
 * The parent (active-workout-screen) remounts this component (via a React
 * `key` keyed on the committed-set count) every time a set is logged or
 * removed, so a fresh draft for the new current set is simply this
 * component's initial state — no reset effect needed.
 */
export default function ExerciseEntryCard({
  slotLog,
  prescription,
  previousSets,
  onLogSet,
  onRemoveLastSet,
  onAddExtraSet,
  onAdvance,
}: {
  slotLog: ExerciseSlotLog;
  prescription: Exclude<Prescription, { type: "qualitative" }>;
  previousSets: SetLog[] | undefined;
  onLogSet: (set: SetLog) => void;
  onRemoveLastSet: () => void;
  onAddExtraSet: () => void;
  onAdvance: () => void;
}) {
  const targetSets = prescription.sets + (slotLog.extraSets ?? 0);
  const currentSetNumber = slotLog.sets.length + 1;
  const perSideLabel = "perSide" in prescription && prescription.perSide ? " (each side)" : "";

  const [weight, setWeight] = useState(() =>
    prescription.type === "repetitions" ? prefillNumeric(slotLog.sets, previousSets, "weight") : ""
  );
  const [reps, setReps] = useState("");
  const [rir, setRir] = useState<number | undefined>(undefined);
  const [seconds, setSeconds] = useState(() => {
    if (prescription.type !== "hold" && prescription.type !== "duration") return "";
    return prefillNumeric(slotLog.sets, previousSets, "seconds") || String(prescription.maxSeconds);
  });
  const [timeSeconds, setTimeSeconds] = useState("");

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
        onUseWeight={(value) => setWeight(String(value))}
        onUseSeconds={(value) => setSeconds(String(value))}
      />

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
                onChange={(e) => setWeight(e.target.value)}
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
                onChange={(e) => setReps(e.target.value)}
                className="h-16 rounded-xl border border-line-default bg-surface-2 px-4 font-display text-3xl tabular-nums text-ink-primary shadow-well transition-colors focus:border-accent focus:outline-none"
                placeholder={formatRange(prescription.minReps, prescription.maxReps)}
                autoFocus
              />
            </label>
          </div>
          <RirSelector value={rir} onChange={setRir} />
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
              onChange={(e) => setSeconds(e.target.value)}
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
              onChange={(e) => setTimeSeconds(e.target.value)}
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
    </div>
  );
}
