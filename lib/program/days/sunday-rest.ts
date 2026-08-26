/**
 * Sunday: Complete Rest. Source: TRAINING_SYSTEM.md §9.
 * CLAUDE.md non-negotiables 11 and 20: Sunday is a true, complete rest day
 * and must never render a manufactured workout.
 */

import type { RestDayTemplate } from '../program-types';

export const SUNDAY_REST: RestDayTemplate = {
  restDay: true,
  id: 'sunday-rest',
  weekday: 'sunday',
  name: 'Complete Rest',
  description:
    'No required workout. No guilt-driven conditioning. No requirement to close rings or maintain a streak. Walking and ordinary life activity are fine.',
};
