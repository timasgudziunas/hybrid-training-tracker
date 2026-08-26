import type { BenchmarkDefinition } from "./benchmark-definitions";

/** Renders a stored numeric athletic_benchmarks.value using the benchmark's
 * own unit and input kind, e.g. "1.85s", "8 reps", "Tuck L-Sit". */
export function formatBenchmarkValue(definition: BenchmarkDefinition, value: number): string {
  if (definition.input.kind === "ordinal-level") {
    const level = definition.input.levels.find((entry) => entry.order === value);
    return level ? level.name : `Level ${value}`;
  }

  switch (definition.unit) {
    case "s":
      return `${value.toFixed(2)}s`;
    case "reps":
      return `${Math.round(value)} reps`;
    case "in":
      return `${value.toFixed(1)} in`;
    default:
      return definition.unit ? `${value} ${definition.unit}` : `${value}`;
  }
}

/** A short-form axis tick formatter for a chart's y axis, keyed off unit
 * rather than the full sentence formatBenchmarkValue produces. */
export function axisFormatterForUnit(unit: string): (value: number) => string {
  if (unit === "reps" || unit === "level") {
    return (value: number) => value.toFixed(0);
  }
  return (value: number) => value.toFixed(1);
}
