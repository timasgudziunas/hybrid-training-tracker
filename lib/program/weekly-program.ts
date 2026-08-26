/**
 * The full weekly program, assembled from per-day seed files. This is the
 * single canonical program definition (CLAUDE.md non-negotiable 16) — UI
 * code must render from this, never hardcode workout content.
 */

import type { Weekday, WorkoutTemplate } from './program-types';
import { MONDAY_UPPER_A } from './days/monday-upper-a';
import { TUESDAY_SPEED_LOWER_A } from './days/tuesday-speed-lower-a';
import { WEDNESDAY_UPPER_B } from './days/wednesday-upper-b';
import { THURSDAY_RECOVERY_MOBILITY } from './days/thursday-recovery-mobility';
import { FRIDAY_POWER_LOWER_B } from './days/friday-power-lower-b';
import { SATURDAY_UPPER_C } from './days/saturday-upper-c';
import { SUNDAY_REST } from './days/sunday-rest';

export const WEEKLY_PROGRAM: Record<Weekday, WorkoutTemplate> = {
  monday: MONDAY_UPPER_A,
  tuesday: TUESDAY_SPEED_LOWER_A,
  wednesday: WEDNESDAY_UPPER_B,
  thursday: THURSDAY_RECOVERY_MOBILITY,
  friday: FRIDAY_POWER_LOWER_B,
  saturday: SATURDAY_UPPER_C,
  sunday: SUNDAY_REST,
};

export function getWorkoutForWeekday(weekday: Weekday): WorkoutTemplate {
  return WEEKLY_PROGRAM[weekday];
}
