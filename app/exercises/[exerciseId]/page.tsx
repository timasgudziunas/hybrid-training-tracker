import Link from "next/link";
import { notFound } from "next/navigation";
import { EXERCISE_CATALOG } from "@/lib/program/exercise-catalog";
import { fetchActiveProgram } from "@/app/program/actions";
import { fetchAthleteSettings } from "@/app/settings/actions";
import { EQUIPMENT_LABELS, MUSCLE_GROUP_LABELS } from "@/lib/program/muscle-group-copy";
import { formatPrescriptionPreset, loggingFieldLabels } from "@/lib/program/set-entry-fields";
import { CATEGORY_LABELS } from "../exercise-category-copy";
import { hasFullGuidance } from "../has-full-guidance";
import { findExercise } from "./find-exercise";
import ProgressionChainLevels from "./progression-chain-levels";

/**
 * Plain-language explanation of double progression (TRAINING_SYSTEM.md §12):
 * hold the rep range, add reps set by set, then once every set reaches the
 * top of the range with good technique, add load and drop back to the
 * bottom of the range. Written once here rather than invented per exercise.
 */
const DOUBLE_PROGRESSION_SENTENCE =
  "This exercise progresses through double progression: work every set within the prescribed rep range, and once every set reaches the top of that range with good technique, add weight and drop back toward the bottom of the range.";

/**
 * Prerenders every catalog exercise at build time (PLAN.md R6: "static
 * friendly"). Program-only ids (dynamicParams defaults to true) are still
 * served, resolved at request time against the active program's own
 * exercises map in the page below.
 */
export function generateStaticParams() {
  return EXERCISE_CATALOG.map((exercise) => ({ exerciseId: exercise.id }));
}

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ exerciseId: string }>;
}) {
  const { exerciseId } = await params;

  const [activeProgramResult, settingsResult] = await Promise.all([fetchActiveProgram(), fetchAthleteSettings()]);
  const showRir = settingsResult.ok ? settingsResult.data.showRir : false;
  const programExercises = activeProgramResult.ok
    ? (activeProgramResult.data?.parsed.exercises ?? null)
    : null;

  const found = findExercise(exerciseId, programExercises);
  if (!found) {
    notFound();
  }

  const { exercise, fromProgram } = found;
  const guidanceAvailable = hasFullGuidance(exercise);

  return (
    <div className="flex flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <Link
          href="/exercises"
          className="w-fit text-sm font-medium text-accent-strong transition-colors active:text-ink-primary"
        >
          Back to the exercise library
        </Link>

        <div className="flex flex-col gap-3 rounded-2xl border border-line-hairline bg-surface-1 p-6 shadow-card sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-line-default px-2.5 py-0.5 text-xs font-medium text-ink-secondary">
              {CATEGORY_LABELS[exercise.category]}
            </span>
            {exercise.muscleGroup ? (
              <span className="rounded-full border border-line-default px-2.5 py-0.5 text-xs font-medium text-ink-secondary">
                {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
              </span>
            ) : null}
            {fromProgram ? (
              <span className="rounded-full border border-line-default px-2.5 py-0.5 text-xs font-medium text-ink-secondary">
                From your program
              </span>
            ) : null}
          </div>

          <h1 className="font-display text-4xl font-bold leading-tight text-ink-primary sm:text-5xl">
            {exercise.name}
          </h1>

          {exercise.primaryMuscles.length > 0 || exercise.secondaryMuscles.length > 0 ? (
            <div className="flex flex-col gap-1 text-sm text-ink-secondary">
              {exercise.primaryMuscles.length > 0 ? (
                <p>
                  <span className="font-medium text-ink-primary">Primary: </span>
                  {exercise.primaryMuscles.join(", ")}
                </p>
              ) : null}
              {exercise.secondaryMuscles.length > 0 ? (
                <p>
                  <span className="font-medium text-ink-primary">Secondary: </span>
                  {exercise.secondaryMuscles.join(", ")}
                </p>
              ) : null}
            </div>
          ) : null}

          {exercise.equipment && exercise.equipment.length > 0 ? (
            <p className="text-sm text-ink-secondary">
              <span className="font-medium text-ink-primary">Equipment: </span>
              {exercise.equipment.map((item) => EQUIPMENT_LABELS[item]).join(", ")}
            </p>
          ) : null}
        </div>

        {guidanceAvailable ? (
          <div className="flex flex-col gap-6 rounded-2xl border border-line-hairline bg-surface-1 p-6 shadow-card sm:p-8">
            {exercise.intendedFeeling ? (
              <section className="flex flex-col gap-1.5">
                <h2 className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">
                  Where you should feel it
                </h2>
                <p className="text-sm text-ink-secondary">{exercise.intendedFeeling}</p>
              </section>
            ) : null}

            {exercise.cues?.length ? (
              <section className="flex flex-col gap-1.5">
                <h2 className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">Cues</h2>
                <ul className="list-inside list-disc text-sm text-ink-secondary">
                  {exercise.cues.map((cue) => (
                    <li key={cue}>{cue}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {exercise.commonMistakes?.length ? (
              <section className="flex flex-col gap-1.5">
                <h2 className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">
                  Common mistakes
                </h2>
                <ul className="list-inside list-disc text-sm text-ink-secondary">
                  {exercise.commonMistakes.map((mistake) => (
                    <li key={mistake}>{mistake}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        ) : (
          <p className="rounded-2xl border border-line-hairline bg-surface-1 p-6 text-sm text-ink-secondary shadow-card">
            Detailed guidance has not been written for this exercise yet.
          </p>
        )}

        <div className="flex flex-col gap-2 rounded-2xl border border-line-hairline bg-surface-1 p-6 shadow-card sm:p-8">
          <h2 className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">Progression</h2>
          {exercise.progressionType === "double-progression" ? (
            <p className="text-sm text-ink-secondary">{DOUBLE_PROGRESSION_SENTENCE}</p>
          ) : exercise.progressionType === "progression-chain" && exercise.progressionChainId ? (
            <ProgressionChainLevels chainId={exercise.progressionChainId} />
          ) : (
            <p className="text-sm text-ink-secondary">This exercise does not use a formal loading progression.</p>
          )}
        </div>

        {exercise.substitutions?.length ? (
          <div className="flex flex-col gap-1.5 rounded-2xl border border-line-hairline bg-surface-1 p-6 shadow-card sm:p-8">
            <h2 className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">Substitutions</h2>
            <ul className="list-inside list-disc text-sm text-ink-secondary">
              {exercise.substitutions.map((substitutionId) => {
                const substituteFound = findExercise(substitutionId, programExercises);
                return (
                  <li key={substitutionId}>
                    {substituteFound ? (
                      <Link
                        href={`/exercises/${substitutionId}`}
                        className="text-accent-strong transition-colors active:text-ink-primary"
                      >
                        {substituteFound.exercise.name}
                      </Link>
                    ) : (
                      substitutionId
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {exercise.defaultPrescription ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-line-hairline bg-surface-1 p-6 shadow-card sm:p-8">
            <h2 className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">Logging preset</h2>
            <p className="text-sm text-ink-tertiary">
              Used when this exercise is added to a workout. Your program&apos;s own sets and reps always win.
            </p>
            <p className="text-sm text-ink-secondary">{formatPrescriptionPreset(exercise.defaultPrescription)}</p>
            <div className="flex flex-wrap gap-2">
              {loggingFieldLabels(exercise, exercise.defaultPrescription, showRir).map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-line-default px-2.5 py-0.5 text-xs font-medium text-ink-tertiary"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
