import type { Exercise, PrescribedExercise, WorkoutSection } from "@/lib/program/program-types";
import { capitalizeLabel } from "./capitalize-label";
import PrescribedExerciseRow from "./prescribed-exercise-row";

/** A run of consecutive exercises sharing a supersetGroup token, or a single
 * exercise with none. The parser guarantees supersetGroup members are
 * contiguous within a section and every group has at least two members, so a
 * simple run-length grouping over the already-ordered list is enough: order
 * is never reshuffled, only visually bracketed. */
type ExerciseGroup =
  | { kind: "single"; exercise: PrescribedExercise }
  | { kind: "superset"; token: string; members: PrescribedExercise[] };

function groupExercises(exercises: PrescribedExercise[]): ExerciseGroup[] {
  const groups: ExerciseGroup[] = [];

  for (const exercise of exercises) {
    const previousGroup = groups[groups.length - 1];
    if (exercise.supersetGroup && previousGroup?.kind === "superset" && previousGroup.token === exercise.supersetGroup) {
      previousGroup.members.push(exercise);
      continue;
    }
    if (exercise.supersetGroup) {
      groups.push({ kind: "superset", token: exercise.supersetGroup, members: [exercise] });
      continue;
    }
    groups.push({ kind: "single", exercise });
  }

  return groups;
}

export default function WorkoutSectionCard({
  section,
  exercises,
}: {
  section: WorkoutSection;
  exercises: Record<string, Exercise>;
}) {
  const orderedExercises = [...section.exercises].sort((a, b) => a.order - b.order);
  const groups = groupExercises(orderedExercises);

  return (
    <section className="flex flex-col gap-2 border-t border-line-hairline pt-5 first:border-t-0 first:pt-0">
      <div className="flex items-center gap-2">
        <span className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-ink-tertiary">
          {capitalizeLabel(section.type)}
        </span>
        {section.optional ? (
          <span className="rounded-full border border-line-default px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-secondary">
            Optional
          </span>
        ) : null}
      </div>

      <h2 className="text-sm font-semibold text-ink-primary">{section.name}</h2>

      {section.notes?.length ? (
        <ul className="flex flex-col gap-1 text-xs text-ink-tertiary">
          {section.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}

      <ul className="flex flex-col divide-y divide-line-hairline">
        {groups.map((group) => {
          if (group.kind === "single") {
            return (
              <PrescribedExerciseRow
                key={`${group.exercise.order}-${group.exercise.exerciseId}`}
                exercise={group.exercise}
                sectionName={section.name}
                exercises={exercises}
              />
            );
          }

          const restLine = group.members.length > 2 ? "rest after the round" : "rest after both";

          return (
            <li key={`superset-${group.token}-${group.members[0].order}`} className="border-l-2 border-accent/60 pl-3">
              <p className="pt-3.5 text-xs font-medium uppercase tracking-wide text-ink-tertiary">
                Superset {group.token}, {restLine}
              </p>
              <ul className="flex flex-col divide-y divide-line-hairline">
                {group.members.map((member) => (
                  <PrescribedExerciseRow
                    key={`${member.order}-${member.exerciseId}`}
                    exercise={member}
                    sectionName={section.name}
                    exercises={exercises}
                    isSupersetMember
                  />
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
