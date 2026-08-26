import type { BenchmarkDefinition } from "./benchmark-definitions";
import { formatBenchmarkValue } from "./format-benchmark-value";

export interface BenchmarkDelta {
  improved: boolean;
  text: string;
}

/** Plain-language change between two readings of the same benchmark, worded
 * per its own direction of improvement (PRODUCT_SPEC section 10's example:
 * "Pull-ups 5 to 8"). Describes only this one metric's change over time;
 * never combined across benchmarks into a single score. */
export function describeBenchmarkDelta(
  definition: BenchmarkDefinition,
  fromValue: number,
  toValue: number
): BenchmarkDelta {
  if (definition.input.kind === "ordinal-level") {
    return {
      improved: toValue > fromValue,
      text: `${formatBenchmarkValue(definition, fromValue)} to ${formatBenchmarkValue(definition, toValue)}`,
    };
  }

  const delta = toValue - fromValue;
  const improved = definition.direction === "lower-is-better" ? delta < 0 : delta > 0;
  const decimals = definition.unit === "reps" ? 0 : 2;
  const magnitude = delta.toFixed(decimals);

  return {
    improved,
    text: delta > 0 ? `+${magnitude}${definition.unit}` : `${magnitude}${definition.unit}`,
  };
}
