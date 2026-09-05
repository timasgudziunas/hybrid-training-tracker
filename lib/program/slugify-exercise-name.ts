/**
 * The ONE exercise id rule (R10, 2026-09-04): an exercise's id is always
 * the slug of its name. The parser has always used this for pasted names
 * (lib/program/parse-program-text.ts), so a pasted "Incline Dumbbell
 * Press" and the catalog's own "Incline Dumbbell Press" share history,
 * previous performance, and the /exercises/[id] URL. Every catalog entry's
 * id must equal slugifyExerciseName(name) (asserted by
 * scripts/test-exercise-catalog.ts).
 */
export function slugifyExerciseName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'exercise';
}

/** Loose match used to pair a typed program name with a catalog entry:
 * case, spacing, and punctuation insensitive. */
export function normalizeExerciseNameForMatch(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}
