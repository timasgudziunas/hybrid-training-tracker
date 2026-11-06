import { formatDateLabel } from "@/lib/date/format-date-label";
import type { ExerciseNoteEntry } from "@/lib/workout-session/exercise-notes-log";

/** "Your notes" card on an exercise's library page: every note the athlete
 * wrote on this exercise during a workout, most recent first. Renders
 * nothing when there are none. */
export default function ExerciseNotesHistory({ entries }: { entries: ExerciseNoteEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line-hairline bg-surface-1 p-6 shadow-card sm:p-8">
      <h2 className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">Your notes</h2>
      <ul className="flex flex-col divide-y divide-line-hairline">
        {entries.map((entry, index) => (
          <li key={`${entry.date}-${index}`} className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0">
            <span className="text-xs text-ink-tertiary">{formatDateLabel(entry.date)}</span>
            <span className="whitespace-pre-wrap text-sm text-ink-primary">{entry.note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
