import { fetchBenchmarkEntries, fetchBodyweightSeries } from "./actions";
import { BENCHMARK_DEFINITIONS } from "@/lib/benchmarks/benchmark-definitions";
import QuickLogForm from "./quick-log-form";
import BenchmarkGroupSection from "./benchmark-group-section";
import CalisthenicsSection from "./calisthenics-section";
import AthleticismVsBodyweight from "./athleticism-vs-bodyweight";

// Data changes on every log; no reason to cache a stale dashboard (same
// posture as app/body/page.tsx).
export const dynamic = "force-dynamic";

/**
 * The athlete's progress dashboard (R5, PLAN.md old Phase 7 / PRODUCT_SPEC
 * sections 9-11). Restrained and data-forward: every benchmark is its own
 * trend, bodyweight sits alongside them without ever collapsing into one
 * "athleticism score" (CLAUDE.md non-negotiable 18).
 *
 * Note: this page is intentionally not wired into app/site-header.tsx yet —
 * that happens in a later integration pass (R8) alongside the rest of the
 * app's navigation.
 */
export default async function ProgressPage() {
  const [benchmarkResult, bodyweightResult] = await Promise.all([fetchBenchmarkEntries(), fetchBodyweightSeries()]);

  const entriesByType = benchmarkResult.ok ? benchmarkResult.data.entries : {};
  const schemaMissing = benchmarkResult.ok ? benchmarkResult.data.schemaMissing : false;
  const benchmarkError = benchmarkResult.ok ? null : benchmarkResult.reason;

  const bodyweightSeries = bodyweightResult.ok ? bodyweightResult.data : [];
  const bodyweightError = bodyweightResult.ok ? null : bodyweightResult.reason;

  const sprintDefinitions = BENCHMARK_DEFINITIONS.filter((definition) => definition.category === "sprint");
  const powerDefinitions = BENCHMARK_DEFINITIONS.filter((definition) => definition.category === "power");
  const strengthDefinitions = BENCHMARK_DEFINITIONS.filter((definition) => definition.category === "strength");
  const lSitDefinition = BENCHMARK_DEFINITIONS.find((definition) => definition.type === "l_sit_hold");
  const plancheDefinition = BENCHMARK_DEFINITIONS.find((definition) => definition.type === "planche_level");

  return (
    <div className="flex flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-1.5">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-ink-tertiary">Progress</p>
          <h1 className="font-display text-3xl font-bold text-ink-primary sm:text-4xl">Athletic Benchmarks</h1>
          <p className="text-sm text-ink-secondary">
            Sprints, jumps, relative strength, and calisthenics, tracked as trends. No single score, just the
            numbers.
          </p>
        </header>

        {schemaMissing ? (
          <p className="rounded-xl border border-warning/30 bg-warning-soft p-3 text-sm text-warning">
            The athletic_benchmarks table has not been created yet. Apply supabase/schema.sql, then measurements
            logged here will save.
          </p>
        ) : null}
        {benchmarkError ? (
          <p className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
            {benchmarkError}
          </p>
        ) : null}
        {bodyweightError ? (
          <p className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
            {bodyweightError}
          </p>
        ) : null}

        <QuickLogForm />

        <BenchmarkGroupSection title="Sprint" definitions={sprintDefinitions} entriesByType={entriesByType} />
        <BenchmarkGroupSection title="Power" definitions={powerDefinitions} entriesByType={entriesByType} />
        <BenchmarkGroupSection
          title="Relative Strength"
          definitions={strengthDefinitions}
          entriesByType={entriesByType}
        />

        {lSitDefinition && plancheDefinition ? (
          <CalisthenicsSection
            lSitDefinition={lSitDefinition}
            plancheDefinition={plancheDefinition}
            lSitEntries={entriesByType[lSitDefinition.type] ?? []}
            plancheEntries={entriesByType[plancheDefinition.type] ?? []}
          />
        ) : null}

        <AthleticismVsBodyweight bodyweightSeries={bodyweightSeries} entriesByType={entriesByType} />
      </div>
    </div>
  );
}
