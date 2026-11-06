import { formatDateLabel } from "@/lib/date/format-date-label";
import type { ExerciseNoteEntry } from "@/lib/workout-session/exercise-notes-log";

/** The full dated log of notes the athlete wrote on one exercise in past
 * sessions, most recent first (owner request 2026-11-06). Rendered by
 * ExerciseSlotView as its own block below the footer row, like the swap
 * panel. Display only: the current session's note is edited through
 * ExerciseNoteField. */
export default function ExerciseNotesLog({
  exerciseName,
  entries,
  onClose,
}: {
  exerciseName: string;
  entries: ExerciseNoteEntry[];
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line-hairline bg-surface-2 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink-primary">Notes for {exerciseName}</h2>
        <button
          type="button"
          onClick={onClose}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-line-default px-3 text-xs font-medium text-ink-secondary transition-colors active:bg-surface-1"
        >
          Close
        </button>
      </div>
      <ul className="flex flex-col divide-y divide-line-hairline">
        {entries.map((entry, index) => (
          <li key={`${entry.date}-${index}`} className="flex flex-col gap-0.5 py-2 first:pt-0 last:pb-0">
            <span className="text-xs text-ink-tertiary">{formatDateLabel(entry.date)}</span>
            <span className="whitespace-pre-wrap text-sm text-ink-primary">{entry.note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
