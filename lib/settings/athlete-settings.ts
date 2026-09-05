/**
 * Athlete-level app settings (R10, 2026-09-04). Pure types and defaults
 * only; persistence is app/settings/actions.ts (one `athlete_settings`
 * key/value table in Supabase so phone and desktop agree, see
 * supabase/schema.sql).
 *
 * Every setting has a default here so the app behaves the same whether the
 * table exists yet or not: a missing table or row simply means defaults.
 */

export interface AthleteSettings {
  /**
   * Whether set entry shows the RIR (reps in reserve) selector. Owner
   * decision 2026-09-04: "I decided to take every exercise to failure", so
   * the default is off. Turning it off hides the input only; RIR values
   * already logged still display in history.
   */
  showRir: boolean;
}

export const DEFAULT_ATHLETE_SETTINGS: AthleteSettings = {
  showRir: false,
};

export type AthleteSettingKey = keyof AthleteSettings;

/** Merges whatever rows exist over the defaults, ignoring unknown keys and
 * wrong-typed values so a hand-edited row can never break the app. */
export function resolveAthleteSettings(stored: Partial<Record<string, unknown>>): AthleteSettings {
  const settings: AthleteSettings = { ...DEFAULT_ATHLETE_SETTINGS };
  if (typeof stored.showRir === 'boolean') settings.showRir = stored.showRir;
  return settings;
}
