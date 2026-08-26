import type { TemplateSlot } from "@/lib/workout-session/flatten-template-slots";
import type { ExerciseSlotLog } from "@/lib/workout-session/workout-session-types";
import { resolveExerciseChoiceName } from "@/app/today/resolve-exercise-name";

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
  onJump,
  onClose,
}: {
  templateSlots: TemplateSlot[];
  slotLogs: Record<string, ExerciseSlotLog>;
  currentSlotKey: string | null;
  onJump: (slotKey: string) => void;
  onClose: () => void;
}) {
  const sections = new Map<string, TemplateSlot[]>();
  for (const slot of templateSlots) {
    const existing = sections.get(slot.section.id) ?? [];
    existing.push(slot);
    sections.set(slot.section.id, existing);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Session overview</h2>
        <button type="button" onClick={onClose} className="text-sm text-zinc-400 active:text-white">
          Close
        </button>
      </div>

      <div className="flex flex-col gap-5 overflow-y-auto">
        {[...sections.entries()].map(([sectionId, slots]) => (
          <div key={sectionId} className="flex flex-col gap-1.5">
            <p className="text-[10px] uppercase tracking-widest text-zinc-600">{slots[0].section.name}</p>
            <ul className="flex flex-col divide-y divide-zinc-900">
              {slots.map((slot) => {
                const log = slotLogs[slot.slotKey];
                const isCurrent = slot.slotKey === currentSlotKey;
                const name = resolveExerciseChoiceName(
                  slot.exercise.exerciseId,
                  slot.exercise.alternativeExerciseIds
                );

                return (
                  <li key={slot.slotKey}>
                    <button
                      type="button"
                      onClick={() => onJump(slot.slotKey)}
                      className={`flex w-full items-center justify-between gap-3 py-3 text-left ${
                        isCurrent ? "text-white" : "text-zinc-300"
                      }`}
                    >
                      <span className="text-sm font-medium">{name}</span>
                      <span
                        className={`text-xs ${
                          isCurrent
                            ? "text-white"
                            : log?.status === "completed"
                              ? "text-zinc-500"
                              : log?.status === "skipped"
                                ? "text-zinc-600"
                                : "text-zinc-600"
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
    </div>
  );
}
