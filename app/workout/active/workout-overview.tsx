import type { Exercise } from "@/lib/program/program-types";
import type { TemplateSlot } from "@/lib/workout-session/flatten-template-slots";
import type { EndedEarlyReason, ExerciseSlotLog } from "@/lib/workout-session/workout-session-types";
import { resolveExerciseChoiceName } from "@/app/today/resolve-exercise-name";
import EndWorkoutEarlyControl from "./end-workout-early-control";

const STATUS_LABEL: Record<ExerciseSlotLog["status"], string> = {
  completed: "Done",
  skipped: "Skipped",
  upcoming: "Upcoming",
};

/** Overview jump list (PRODUCT_SPEC §6): "linear is the default, not a
 * cage" — one tap away, and tapping any exercise jumps straight to it. */
export default function WorkoutOverview({
  templateSlots,
  slotLogs,
  currentSlotKey,
  exercises,
  onJump,
  onClose,
  recoveryMode,
  onToggleRecoveryMode,
  onEndWorkoutEarly,
}: {
  templateSlots: TemplateSlot[];
  slotLogs: Record<string, ExerciseSlotLog>;
  currentSlotKey: string | null;
  exercises: Record<string, Exercise>;
  onJump: (slotKey: string) => void;
  onClose: () => void;
  recoveryMode: boolean;
  onToggleRecoveryMode: () => void;
  onEndWorkoutEarly: (reason?: EndedEarlyReason) => void;
}) {
  const sections = new Map<string, TemplateSlot[]>();
  for (const slot of templateSlots) {
    const existing = sections.get(slot.section.id) ?? [];
    existing.push(slot);
    sections.set(slot.section.id, existing);
  }

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-line-hairline bg-surface-1 p-5 shadow-card sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-ink-primary">Session overview</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-sm font-medium text-ink-secondary transition-colors active:bg-surface-2 active:text-ink-primary"
        >
          Close
        </button>
      </div>

      <div className="flex flex-col gap-5 overflow-y-auto">
        {[...sections.entries()].map(([sectionId, slots]) => (
          <div key={sectionId} className="flex flex-col gap-1.5">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">
              {slots[0].section.name}
            </p>
            <ul className="flex flex-col divide-y divide-line-hairline">
              {slots.map((slot) => {
                const log = slotLogs[slot.slotKey];
                const isCurrent = slot.slotKey === currentSlotKey;
                const name = resolveExerciseChoiceName(
                  exercises,
                  slot.exercise.exerciseId,
                  slot.exercise.alternativeExerciseIds
                );

                return (
                  <li key={slot.slotKey}>
                    <button
                      type="button"
                      onClick={() => onJump(slot.slotKey)}
                      className={`flex w-full items-center justify-between gap-3 py-3 text-left transition-colors ${
                        isCurrent ? "text-accent-strong" : "text-ink-secondary hover:text-ink-primary"
                      }`}
                    >
                      <span className="text-sm font-medium">{name}</span>
                      <span
                        className={`text-xs font-medium ${
                          isCurrent
                            ? "text-accent-strong"
                            : log?.status === "completed"
                              ? "text-success"
                              : "text-ink-tertiary"
                        }`}
                      >
                        {isCurrent ? "Current" : STATUS_LABEL[log?.status ?? "upcoming"]}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 border-t border-line-hairline pt-5">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">
          Modify session
        </p>
        <button
          type="button"
          onClick={onToggleRecoveryMode}
          aria-pressed={recoveryMode}
          className={`self-start rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
            recoveryMode
              ? "border-accent bg-accent-soft text-accent-strong"
              : "border-line-default text-ink-secondary active:bg-surface-2"
          }`}
        >
          Recovery mode {recoveryMode ? "on" : "off"}
        </button>
        <EndWorkoutEarlyControl onConfirm={onEndWorkoutEarly} />
      </div>
    </div>
  );
}
