/**
 * Pure extraction for the per-exercise notes log (owner request 2026-11-06):
 * every note ever written on a slot that logged a given exercise, dated by
 * the session's effective date (make-up sessions credit the missed day, see
 * lib/history/session-filtering.ts), most recent first. The caller
 * (app/workout/actions.ts) fetches the athlete's real sessions and hands the
 * rows here, newest first.
 */

import type { ExerciseSlotLog } from './workout-session-types';

export interface ExerciseNoteEntry {
  /** Effective session date, "yyyy-mm-dd". */
  date: string;
  note: string;
}

export type ExerciseNotesByExercise = Record<string, ExerciseNoteEntry[]>;

export interface ExerciseNotesRow {
  sessionDate: string;
  slots: Record<string, ExerciseSlotLog> | null | undefined;
  makeUpForDate?: string | null;
}

/**
 * `rows` are expected newest first. Blank or whitespace-only notes are
 * skipped; every other note on a slot whose `chosenExerciseId` is requested
 * yields one entry (two slots of the same exercise in one session both
 * count). Each exercise's list is stably sorted by effective date, newest
 * first, so a make-up session lands on the day it is credited to. Ids with
 * no notes are absent from the result.
 */
export function extractExerciseNotes(rows: ExerciseNotesRow[], exerciseIds: string[]): ExerciseNotesByExercise {
  const wanted = new Set(exerciseIds);
  const result: ExerciseNotesByExercise = {};

  for (const row of rows) {
    if (!row.slots) continue;
    const date = row.makeUpForDate ?? row.sessionDate;

    for (const slot of Object.values(row.slots)) {
      const id = slot.chosenExerciseId;
      if (!id || !wanted.has(id)) continue;
      const note = slot.note?.trim();
      if (!note) continue;
      (result[id] ??= []).push({ date, note });
    }
  }

  for (const entries of Object.values(result)) {
    entries.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }

  return result;
}
