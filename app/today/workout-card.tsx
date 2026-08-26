import type { Exercise, TrainingDayTemplate } from "@/lib/program/program-types";
import WorkoutSectionCard from "./workout-section-card";
import StartWorkoutButton from "./start-workout-button";

export default function WorkoutCard({
  template,
  exercises,
  showStartButton = true,
}: {
  template: TrainingDayTemplate;
  exercises: Record<string, Exercise>;
  /** Off for a program preview (paste screen) — there is nothing to start
   * yet, this template may not even be saved. */
  showStartButton?: boolean;
}) {
  const orderedSections = [...template.sections].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-line-hairline bg-surface-1 p-5 shadow-card sm:p-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-bold leading-tight text-ink-primary sm:text-4xl">
          {template.name}
        </h1>
        {template.description ? <p className="text-sm text-ink-secondary">{template.description}</p> : null}

        {template.targetDurationMinutes || template.ultimatePracticeLater ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {template.targetDurationMinutes ? (
              <span className="font-display text-sm font-semibold tabular-nums text-ink-tertiary">
                Target: {template.targetDurationMinutes} min
              </span>
            ) : null}
            {template.ultimatePracticeLater ? (
              <span className="rounded-full border border-line-default px-2.5 py-0.5 text-xs font-medium text-ink-secondary">
                Ultimate practice later today
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {showStartButton ? <StartWorkoutButton /> : null}

      <div className="flex flex-col">
        {orderedSections.map((section) => (
          <WorkoutSectionCard key={section.id} section={section} exercises={exercises} />
        ))}
      </div>
    </div>
  );
}
