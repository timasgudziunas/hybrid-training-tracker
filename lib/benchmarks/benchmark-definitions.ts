/**
 * Config-over-code definitions for every athletic benchmark tracked in
 * `athletic_benchmarks` (TRAINING_SYSTEM.md section 19, PRODUCT_SPEC section
 * 9). Adding or adjusting a benchmark is a one-line edit to this list;
 * nothing about a benchmark's label, unit, or input control is hardcoded
 * into a component.
 *
 * No composite "athleticism score" is ever derived from this data
 * (CLAUDE.md non-negotiable 18, PRODUCT_SPEC section 10). Each benchmark
 * stays a standalone metric, shown as its own trend.
 */

import { PLANCHE_PROGRESSION } from "@/lib/program/progression-chains";
import type { ProgressionChainLevel } from "@/lib/program/program-types";

export type BenchmarkDirection = "lower-is-better" | "higher-is-better";

export type BenchmarkCategory = "sprint" | "power" | "strength" | "calisthenics";

export type BenchmarkInput =
  | { kind: "numeric"; step: number; min: number; max: number; placeholder: string }
  | { kind: "ordinal-level"; levels: ProgressionChainLevel[] };

export interface BenchmarkDefinition {
  /** Stored verbatim as athletic_benchmarks.benchmark_type. */
  type: string;
  label: string;
  unit: string;
  direction: BenchmarkDirection;
  category: BenchmarkCategory;
  input: BenchmarkInput;
  /** One plain sentence shown as help text next to the quick log field. */
  helpText: string;
}

export const BENCHMARK_DEFINITIONS: BenchmarkDefinition[] = [
  {
    type: "sprint_10m",
    label: "10m Sprint",
    unit: "s",
    direction: "lower-is-better",
    category: "sprint",
    input: { kind: "numeric", step: 0.01, min: 0.5, max: 10, placeholder: "1.85" },
    helpText: "Acceleration. Lower is faster.",
  },
  {
    type: "sprint_20m",
    label: "20m Sprint",
    unit: "s",
    direction: "lower-is-better",
    category: "sprint",
    input: { kind: "numeric", step: 0.01, min: 1, max: 15, placeholder: "3.10" },
    helpText: "Acceleration. Lower is faster.",
  },
  {
    type: "sprint_30m",
    label: "30m Sprint",
    unit: "s",
    direction: "lower-is-better",
    category: "sprint",
    input: { kind: "numeric", step: 0.01, min: 1.5, max: 20, placeholder: "4.30" },
    helpText: "Top end speed. Lower is faster.",
  },
  {
    // Standing broad jump is recorded in inches, not centimeters.
    type: "broad_jump",
    label: "Standing Broad Jump",
    unit: "in",
    direction: "higher-is-better",
    category: "power",
    input: { kind: "numeric", step: 0.5, min: 12, max: 144, placeholder: "84" },
    helpText: "Horizontal power, in inches. Higher is better.",
  },
  {
    type: "vertical_jump",
    label: "Vertical Jump",
    unit: "in",
    direction: "higher-is-better",
    category: "power",
    input: { kind: "numeric", step: 0.5, min: 4, max: 60, placeholder: "22" },
    helpText: "Vertical power, in inches. Higher is better.",
  },
  {
    type: "strict_pull_ups",
    label: "Strict Pull-Ups",
    unit: "reps",
    direction: "higher-is-better",
    category: "strength",
    input: { kind: "numeric", step: 1, min: 0, max: 100, placeholder: "5" },
    helpText: "Max strict reps, no kipping. Relative pulling strength.",
  },
  {
    type: "strict_dips",
    label: "Strict Dips",
    unit: "reps",
    direction: "higher-is-better",
    category: "strength",
    input: { kind: "numeric", step: 1, min: 0, max: 100, placeholder: "10" },
    helpText: "Max strict reps. Relative pushing strength.",
  },
  {
    type: "l_sit_hold",
    label: "L-Sit Hold",
    unit: "s",
    direction: "higher-is-better",
    category: "calisthenics",
    input: { kind: "numeric", step: 1, min: 0, max: 300, placeholder: "12" },
    helpText: "Best single hold, in seconds. Body control and compression strength.",
  },
  {
    type: "planche_level",
    label: "Planche Progression",
    unit: "level",
    direction: "higher-is-better",
    category: "calisthenics",
    // Levels are owned by lib/program/progression-chains.ts, the same chain
    // the active workout UI reads from. Never redefine the chain here.
    input: { kind: "ordinal-level", levels: PLANCHE_PROGRESSION.levels },
    helpText: "Current step in the planche chain.",
  },
];

export const BENCHMARK_DEFINITIONS_BY_TYPE: Record<string, BenchmarkDefinition> = Object.fromEntries(
  BENCHMARK_DEFINITIONS.map((definition) => [definition.type, definition])
);

export function getBenchmarkDefinition(type: string): BenchmarkDefinition | undefined {
  return BENCHMARK_DEFINITIONS_BY_TYPE[type];
}
