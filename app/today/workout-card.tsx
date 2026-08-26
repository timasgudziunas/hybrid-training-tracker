import type { TrainingDayTemplate } from "@/lib/program/program-types";
import WorkoutSectionCard from "./workout-section-card";

export default function WorkoutCard({ template }: { template: TrainingDayTemplate }) {
  const orderedSections = [...template.sections].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-white">{template.name}</h1>
        {template.description ? <p className="text-sm text-zinc-400">{template.description}</p> : null}

        {template.targetDurationMinutes || template.ultimatePracticeLater ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {template.targetDurationMinutes ? (
              <span className="text-xs text-zinc-500">Target: {template.targetDurationMinutes} min</span>
            ) : null}
            {template.ultimatePracticeLater ? (
              <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-xs text-zinc-300">
                Ultimate practice later today
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col">
        {orderedSections.map((section) => (
          <WorkoutSectionCard key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}
