import TrendChart from "./trend-chart";
import { formatBenchmarkValue, axisFormatterForUnit } from "@/lib/benchmarks/format-benchmark-value";
import type { BenchmarkDefinition } from "@/lib/benchmarks/benchmark-definitions";
import type { BenchmarkEntry } from "./actions";

/** One benchmark's trend card: latest value as a big numeral with its date,
 * then a small history chart. Used for every numeric (non ordinal-level)
 * benchmark; planche's ordinal chain gets its own presentation in
 * calisthenics-section.tsx. */
export default function BenchmarkTrendCard({
  definition,
  entries,
}: {
  definition: BenchmarkDefinition;
  entries: BenchmarkEntry[];
}) {
  const data = entries.map((entry) => ({ date: entry.measuredOn, value: entry.value }));

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line-hairline bg-surface-1 p-4 shadow-card sm:p-5">
      <h3 className="text-sm font-semibold text-ink-primary">{definition.label}</h3>
      <TrendChart
        data={data}
        ariaLabel={`${definition.label} trend over time`}
        formatLatest={(value) => formatBenchmarkValue(definition, value)}
        formatAxisValue={axisFormatterForUnit(definition.unit)}
        caption={definition.direction === "lower-is-better" ? "Lower is better." : "Higher is better."}
      />
    </div>
  );
}
