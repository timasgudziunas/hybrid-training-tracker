import BenchmarkTrendCard from "./benchmark-trend-card";
import type { BenchmarkDefinition } from "@/lib/benchmarks/benchmark-definitions";
import type { BenchmarkEntry } from "./actions";

/**
 * Calisthenics tracking (PRODUCT_SPEC section 11): L-sit as a hold-seconds
 * trend like any other benchmark, planche as its current chain level plus a
 * dated history. Planche is ordinal (a named step, not a magnitude), so it
 * gets a level track instead of a line chart: a staircase of one or two
 * points would not read as a meaningful trend line.
 */
export default function CalisthenicsSection({
  lSitDefinition,
  plancheDefinition,
  lSitEntries,
  plancheEntries,
}: {
  lSitDefinition: BenchmarkDefinition;
  plancheDefinition: BenchmarkDefinition;
  lSitEntries: BenchmarkEntry[];
  plancheEntries: BenchmarkEntry[];
}) {
  const plancheLevels = plancheDefinition.input.kind === "ordinal-level" ? plancheDefinition.input.levels : [];
  const latestPlanche = plancheEntries.length > 0 ? plancheEntries[plancheEntries.length - 1] : null;
  const currentLevel = latestPlanche
    ? plancheLevels.find((level) => level.order === latestPlanche.value) ?? null
    : null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">Calisthenics</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <BenchmarkTrendCard definition={lSitDefinition} entries={lSitEntries} />

        <div className="flex flex-col gap-3 rounded-2xl border border-line-hairline bg-surface-1 p-4 shadow-card sm:p-5">
          <h3 className="text-sm font-semibold text-ink-primary">{plancheDefinition.label}</h3>

          {currentLevel && latestPlanche ? (
            <div className="flex flex-col gap-1">
              <p className="font-display text-3xl font-bold text-ink-primary">{currentLevel.name}</p>
              <p className="text-xs text-ink-tertiary">
                {latestPlanche.measuredOn}. Level {currentLevel.order} of {plancheLevels.length}.
              </p>
            </div>
          ) : (
            <p className="text-sm text-ink-tertiary">No measurements yet.</p>
          )}

          {plancheLevels.length > 0 ? (
            <ol className="flex flex-col gap-1.5">
              {plancheLevels.map((level) => {
                const reached = currentLevel ? level.order <= currentLevel.order : false;
                return (
                  <li
                    key={level.id}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                      reached ? "bg-accent-soft text-ink-primary" : "bg-surface-2 text-ink-tertiary"
                    }`}
                  >
                    <span className="font-display text-xs tabular-nums">{level.order}</span>
                    <span>{level.name}</span>
                  </li>
                );
              })}
            </ol>
          ) : null}

          {plancheEntries.length > 1 ? (
            <div className="flex flex-col divide-y divide-line-hairline">
              {plancheEntries
                .slice()
                .reverse()
                .map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between py-1.5 text-xs">
                    <span className="text-ink-tertiary">{entry.measuredOn}</span>
                    <span className="text-ink-secondary">
                      {plancheLevels.find((level) => level.order === entry.value)?.name ?? `Level ${entry.value}`}
                    </span>
                  </div>
                ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
