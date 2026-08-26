import Link from "next/link";

/**
 * Scoped not-found state (Next file convention) for an exerciseId neither
 * the catalog nor the active program has a record of. Reached via
 * next/navigation notFound() in page.tsx.
 */
export default function ExerciseNotFound() {
  return (
    <div className="flex flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-ink-tertiary">
          Exercise Library
        </p>
        <h1 className="font-display text-3xl font-bold text-ink-primary">Exercise not found</h1>
        <p className="text-sm text-ink-secondary">
          This exercise is not in the library or in the active program.
        </p>
        <Link
          href="/exercises"
          className="w-fit text-sm font-medium text-accent-strong transition-colors active:text-ink-primary"
        >
          Back to the exercise library
        </Link>
      </div>
    </div>
  );
}
