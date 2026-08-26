import type { ExerciseCategory } from "@/lib/program/program-types";

/**
 * Display order and labels for the exercise library's category grouping
 * (PLAN.md R6 / old Phase 8, PRODUCT_SPEC.md §12: "hypertrophy, strength,
 * speed, power, mobility, calisthenics, rehabilitation/prehab"), extended
 * with cardio since ExerciseCategory already includes it (program-types.ts).
 * Config over code: this is the one place the grouping order and copy live.
 */
export const CATEGORY_ORDER: ExerciseCategory[] = [
  "hypertrophy",
  "strength",
  "speed",
  "power",
  "mobility",
  "calisthenics",
  "rehabilitation-prehab",
  "cardio",
];

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  hypertrophy: "Hypertrophy",
  strength: "Strength",
  speed: "Speed",
  power: "Power",
  mobility: "Mobility",
  calisthenics: "Calisthenics",
  "rehabilitation-prehab": "Rehabilitation and Prehab",
  cardio: "Cardio",
};
