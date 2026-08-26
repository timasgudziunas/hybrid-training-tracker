import type { ResolvedProgram, Weekday } from "@/lib/program/program-types";
import { capitalizeLabel } from "@/app/today/capitalize-label";
import WorkoutCard from "@/app/today/workout-card";
import RestDayCard from "@/app/today/rest-day-card";

const WEEK_ORDER: Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

/** Renders every day of a ResolvedProgram, Monday through Sunday, in the
 * same card style as the Today screen — used for the paste screen's
 * preview before anything is saved, so the athlete sees exactly what
 * Today will look like on each day. */
export default function ProgramWeekPreview({ program }: { program: ResolvedProgram }) {
  return (
    <div className="flex flex-col gap-5">
      {WEEK_ORDER.map((weekday) => {
        const template = program.templates[weekday];
        return (
          <div key={weekday} className="flex flex-col gap-2">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">
              {capitalizeLabel(weekday)}
            </p>
            {template.restDay ? (
              <RestDayCard template={template} />
            ) : (
              <WorkoutCard template={template} exercises={program.exercises} showStartButton={false} />
            )}
          </div>
        );
      })}
    </div>
  );
}
