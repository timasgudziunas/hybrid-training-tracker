"use client";

import { useState } from "react";
import { BENCHMARK_DEFINITIONS } from "@/lib/benchmarks/benchmark-definitions";
import { formatBenchmarkValue, axisFormatterForUnit } from "@/lib/benchmarks/format-benchmark-value";
import { describeBenchmarkDelta } from "@/lib/benchmarks/describe-benchmark-delta";
import TrendChart from "./trend-chart";
import type { BenchmarkEntry, BodyweightPoint } from "./actions";

// Ordinal-level benchmarks (planche) are excluded: a staircase of one or two
// level steps doesn't read as a magnitude trend next to bodyweight.
const COMPARABLE_DEFINITIONS = BENCHMARK_DEFINITIONS.filter((definition) => definition.input.kind === "numeric");

/**
 * PRODUCT_SPEC section 10, "Athleticism vs Bodyweight": is the athlete
 * gaining useful mass? Bodyweight trend alongside a chosen benchmark trend,
 * plus the full-range deltas from the spec's own example ("Bodyweight +4.2
 * lb, Pull-ups 5 to 8"). Deliberately two separate single-axis charts, never
 * one chart with two y axes, and never reduced to a single score.
 */
export default function AthleticismVsBodyweight({
  bodyweightSeries,
  entriesByType,
}: {
  bodyweightSeries: BodyweightPoint[];
  entriesByType: Record<string, BenchmarkEntry[]>;
}) {
  const [selectedType, setSelectedType] = useState(COMPARABLE_DEFINITIONS[0]?.type ?? "");
  const selectedDefinition = COMPARABLE_DEFINITIONS.find((definition) => definition.type === selectedType) ?? null;
  const selectedEntries = selectedDefinition ? entriesByType[selectedDefinition.type] ?? [] : [];

  const bodyweightData = bodyweightSeries.map((point) => ({ date: point.date, value: point.weightLbs }));
  const benchmarkData = selectedEntries.map((entry) => ({ date: entry.measuredOn, value: entry.value }));

  const bodyweightDelta =
    bodyweightSeries.length >= 2
      ? bodyweightSeries[bodyweightSeries.length - 1].weightLbs - bodyweightSeries[0].weightLbs
      : null;

  const benchmarkDelta =
    selectedDefinition && selectedEntries.length >= 2
      ? describeBenchmarkDelta(selectedDefinition, selectedEntries[0].value, selectedEntries[selectedEntries.length - 1].value)
      : null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">
          Athleticism vs Bodyweight
        </h2>
        <p className="text-xs text-ink-tertiary">
          Bodyweight next to a benchmark of your choice, over the same stretch of time. This shows what happened
          together, not what caused what.
        </p>
      </div>

      {COMPARABLE_DEFINITIONS.length > 0 ? (
        <label className="flex flex-col gap-1.5 sm:w-64">
          <span className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">Compare against</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="h-12 rounded-xl border border-line-default bg-surface-2 px-3 text-sm text-ink-primary shadow-well transition-colors focus:border-accent focus:outline-none"
          >
            {COMPARABLE_DEFINITIONS.map((definition) => (
              <option key={definition.type} value={definition.type}>
                {definition.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-2xl border border-line-hairline bg-surface-1 p-4 shadow-card sm:p-5">
          <h3 className="text-sm font-semibold text-ink-primary">Bodyweight</h3>
          <TrendChart
            data={bodyweightData}
            ariaLabel="Bodyweight trend over time"
            formatLatest={(value) => `${value.toFixed(1)} lb`}
            formatAxisValue={(value) => value.toFixed(0)}
          />
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-line-hairline bg-surface-1 p-4 shadow-card sm:p-5">
          <h3 className="text-sm font-semibold text-ink-primary">{selectedDefinition?.label ?? "Benchmark"}</h3>
          {selectedDefinition ? (
            <TrendChart
              data={benchmarkData}
              ariaLabel={`${selectedDefinition.label} trend over time`}
              formatLatest={(value) => formatBenchmarkValue(selectedDefinition, value)}
              formatAxisValue={axisFormatterForUnit(selectedDefinition.unit)}
              caption={selectedDefinition.direction === "lower-is-better" ? "Lower is better." : "Higher is better."}
            />
          ) : (
            <p className="text-sm text-ink-tertiary">No benchmarks configured.</p>
          )}
        </div>
      </div>

      {bodyweightDelta !== null || benchmarkDelta ? (
        <div className="flex flex-col divide-y divide-line-hairline rounded-2xl border border-line-hairline bg-surface-1 px-5">
          {bodyweightDelta !== null ? (
            <div className="flex items-center justify-between py-2.5">
              <span className="text-sm text-ink-secondary">Bodyweight, full range</span>
              <span className="font-display text-base font-semibold tabular-nums text-ink-primary">
                {bodyweightDelta > 0 ? "+" : ""}
                {bodyweightDelta.toFixed(1)} lb
              </span>
            </div>
          ) : null}
          {benchmarkDelta && selectedDefinition ? (
            <div className="flex items-center justify-between py-2.5">
              <span className="text-sm text-ink-secondary">{selectedDefinition.label}, full range</span>
              <span
                className={`font-display text-base font-semibold tabular-nums ${
                  benchmarkDelta.improved ? "text-success" : "text-ink-primary"
                }`}
              >
                {benchmarkDelta.text}
              </span>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
