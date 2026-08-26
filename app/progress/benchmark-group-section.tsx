import BenchmarkTrendCard from "./benchmark-trend-card";
import type { BenchmarkDefinition } from "@/lib/benchmarks/benchmark-definitions";
import type { BenchmarkEntry } from "./actions";

/** A titled grid of benchmark trend cards (sprint, power, relative strength).
 * Desktop uses the extra width for a multi-column grid; mobile stacks. */
export default function BenchmarkGroupSection({
  title,
  definitions,
  entriesByType,
}: {
  title: string;
  definitions: BenchmarkDefinition[];
  entriesByType: Record<string, BenchmarkEntry[]>;
}) {
  if (definitions.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {definitions.map((definition) => (
          <BenchmarkTrendCard
            key={definition.type}
            definition={definition}
            entries={entriesByType[definition.type] ?? []}
          />
        ))}
      </div>
    </section>
  );
}
