"use client";

import { useState } from "react";
import { getLocalDateString } from "@/lib/date/local-date-string";
import { BENCHMARK_DEFINITIONS } from "@/lib/benchmarks/benchmark-definitions";
import { logBenchmarkEntry } from "./actions";

type SaveState = { status: "idle" } | { status: "saving" } | { status: "success" } | { status: "error"; message: string };

/** Quick-log: pick a benchmark, enter a value (or, for planche, pick a
 * level), date defaults to today (device-local, not server UTC). Saving
 * revalidates /progress server-side, so every chart below picks up the new
 * point without a manual refresh. */
export default function QuickLogForm() {
  const [type, setType] = useState(BENCHMARK_DEFINITIONS[0].type);
  // Lazy init, computed once on the client — same pattern as
  // app/body/today-checkin-section.tsx's `today` default.
  const [date, setDate] = useState(() => getLocalDateString(new Date()));
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [state, setState] = useState<SaveState>({ status: "idle" });

  const definition = BENCHMARK_DEFINITIONS.find((entry) => entry.type === type) ?? BENCHMARK_DEFINITIONS[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const numericValue = Number.parseFloat(value);
    if (!Number.isFinite(numericValue)) {
      setState({ status: "error", message: "Enter a value." });
      return;
    }

    setState({ status: "saving" });
    const result = await logBenchmarkEntry({ type: definition.type, measuredOn: date, value: numericValue, notes });
    if (result.ok) {
      setState({ status: "success" });
      setValue("");
      setNotes("");
    } else {
      setState({ status: "error", message: result.reason });
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-line-hairline bg-surface-1 p-5 shadow-card sm:p-6"
    >
      <h2 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">
        Log a measurement
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">Benchmark</span>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setValue("");
              setState({ status: "idle" });
            }}
            className="h-12 rounded-xl border border-line-default bg-surface-2 px-3 text-sm text-ink-primary shadow-well transition-colors focus:border-accent focus:outline-none"
          >
            {BENCHMARK_DEFINITIONS.map((entry) => (
              <option key={entry.type} value={entry.type}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-12 rounded-xl border border-line-default bg-surface-2 px-3 text-sm text-ink-primary shadow-well transition-colors focus:border-accent focus:outline-none"
          />
        </label>
      </div>

      {definition.input.kind === "ordinal-level" ? (
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">Level</span>
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
            className="h-12 rounded-xl border border-line-default bg-surface-2 px-3 text-sm text-ink-primary shadow-well transition-colors focus:border-accent focus:outline-none"
          >
            <option value="" disabled>
              Pick a level
            </option>
            {definition.input.levels.map((level) => (
              <option key={level.id} value={level.order}>
                {level.name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">
            Value ({definition.unit})
          </span>
          <input
            type="number"
            inputMode="decimal"
            step={definition.input.step}
            min={definition.input.min}
            max={definition.input.max}
            placeholder={definition.input.placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
            className="h-14 rounded-xl border border-line-default bg-surface-2 px-4 font-display text-2xl tabular-nums text-ink-primary shadow-well transition-colors focus:border-accent focus:outline-none"
          />
        </label>
      )}
      <p className="text-xs text-ink-tertiary">{definition.helpText}</p>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">Notes (optional)</span>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
          className="h-11 rounded-xl border border-line-default bg-surface-2 px-3 text-sm text-ink-primary shadow-well transition-colors focus:border-accent focus:outline-none"
        />
      </label>

      {state.status === "error" ? <p className="text-sm text-danger">{state.message}</p> : null}
      {state.status === "success" ? <p className="text-sm text-success">Saved.</p> : null}

      <button
        type="submit"
        disabled={state.status === "saving"}
        className="h-12 rounded-xl bg-accent text-sm font-semibold text-accent-ink transition-colors active:bg-accent-strong disabled:opacity-50"
      >
        {state.status === "saving" ? "Saving..." : "Save measurement"}
      </button>
    </form>
  );
}
