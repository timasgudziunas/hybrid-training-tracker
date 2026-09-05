"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  availableEquipment,
  DEFAULT_EXERCISE_FILTERS,
  filterAndSortExercises,
  groupExercises,
  type ExerciseFilterState,
  type ExerciseSort,
} from "@/lib/program/exercise-filters";
import { EQUIPMENT_LABELS, MUSCLE_GROUP_LABELS, MUSCLE_GROUP_ORDER } from "@/lib/program/muscle-group-copy";
import type { Equipment, ExerciseCategory, MuscleGroup } from "@/lib/program/program-types";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "./exercise-category-copy";
import type { LibraryExerciseEntry } from "./merge-exercise-sources";

const SORT_OPTIONS: { value: ExerciseSort; label: string }[] = [
  { value: "muscle-group", label: "Muscle group" },
  { value: "name", label: "Name" },
  { value: "category", label: "Category" },
];

const selectClassName =
  "h-11 w-full rounded-xl border border-line-default bg-surface-2 px-3 text-sm text-ink-primary shadow-well transition-colors focus:border-accent focus:outline-none sm:w-auto";

/**
 * Exercise library browser (R10). All filtering/grouping/sort logic lives in
 * lib/program/exercise-filters.ts so it stays unit testable outside React;
 * this component is just state plumbing and rendering. All ~250 catalog
 * entries plus a handful of program-only ones are passed down in one shot
 * from the server component, so filtering stays a plain in-memory operation
 * with no extra fetch.
 */
export default function ExerciseLibraryBrowser({ entries }: { entries: LibraryExerciseEntry[] }) {
  const [filters, setFilters] = useState<ExerciseFilterState>(DEFAULT_EXERCISE_FILTERS);

  const muscleGroupCounts = useMemo(() => {
    const counts = new Map<MuscleGroup, number>();
    for (const entry of entries) {
      if (!entry.muscleGroup) continue;
      counts.set(entry.muscleGroup, (counts.get(entry.muscleGroup) ?? 0) + 1);
    }
    return counts;
  }, [entries]);

  const presentMuscleGroups = useMemo(
    () => MUSCLE_GROUP_ORDER.filter((group) => (muscleGroupCounts.get(group) ?? 0) > 0),
    [muscleGroupCounts]
  );

  const presentEquipment = useMemo(() => availableEquipment(entries), [entries]);

  const filtered = useMemo(() => filterAndSortExercises(entries, filters), [entries, filters]);
  const groups = useMemo(() => groupExercises(filtered, filters.sort), [filtered, filters.sort]);

  const hasActiveFilters =
    filters.query !== "" ||
    filters.muscleGroup !== "all" ||
    filters.category !== "all" ||
    filters.equipment !== "all";

  function clearFilters() {
    setFilters(DEFAULT_EXERCISE_FILTERS);
  }

  return (
    <div className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5">
        <span className="sr-only">Search exercises</span>
        <input
          type="text"
          value={filters.query}
          onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
          placeholder="Search exercises or muscles"
          className="h-12 rounded-xl border border-line-default bg-surface-2 px-4 text-sm text-ink-primary shadow-well transition-colors focus:border-accent focus:outline-none"
        />
      </label>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <button
          type="button"
          onClick={() => setFilters((prev) => ({ ...prev, muscleGroup: "all" }))}
          className={`flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors ${
            filters.muscleGroup === "all"
              ? "border-accent bg-accent-soft text-accent-strong"
              : "border-line-default bg-surface-2 text-ink-secondary active:bg-surface-3"
          }`}
        >
          All
          <span className="text-xs tabular-nums text-ink-tertiary">{entries.length}</span>
        </button>
        {presentMuscleGroups.map((group) => (
          <button
            key={group}
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, muscleGroup: group }))}
            className={`flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors ${
              filters.muscleGroup === group
                ? "border-accent bg-accent-soft text-accent-strong"
                : "border-line-default bg-surface-2 text-ink-secondary active:bg-surface-3"
            }`}
          >
            {MUSCLE_GROUP_LABELS[group]}
            <span className="text-xs tabular-nums text-ink-tertiary">{muscleGroupCounts.get(group)}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <label className="flex flex-1 flex-col gap-1.5 sm:flex-none">
          <span className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">Category</span>
          <select
            value={filters.category}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, category: e.target.value as ExerciseCategory | "all" }))
            }
            className={selectClassName}
          >
            <option value="all">All categories</option>
            {CATEGORY_ORDER.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-1 flex-col gap-1.5 sm:flex-none">
          <span className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">Equipment</span>
          <select
            value={filters.equipment}
            onChange={(e) => setFilters((prev) => ({ ...prev, equipment: e.target.value as Equipment | "all" }))}
            className={selectClassName}
          >
            <option value="all">All equipment</option>
            {presentEquipment.map((equipment) => (
              <option key={equipment} value={equipment}>
                {EQUIPMENT_LABELS[equipment]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-1 flex-col gap-1.5 sm:flex-none">
          <span className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">Sort</span>
          <select
            value={filters.sort}
            onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value as ExerciseSort }))}
            className={selectClassName}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-widest text-ink-tertiary">
          {filtered.length} {filtered.length === 1 ? "exercise" : "exercises"}
        </p>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-medium uppercase tracking-widest text-accent-strong transition-colors active:text-ink-primary"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-line-hairline bg-surface-1 p-6 shadow-card">
          <p className="text-sm text-ink-secondary">No exercises match. Clear the filters.</p>
          <button
            type="button"
            onClick={clearFilters}
            className="flex h-11 items-center rounded-full border border-line-default bg-surface-2 px-4 text-sm font-medium text-ink-primary transition-colors active:bg-surface-3"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {groups.map((group) => (
            <section
              key={group.key}
              className="flex flex-col gap-2 rounded-2xl border border-line-hairline bg-surface-1 p-5 shadow-card"
            >
              {group.label ? (
                <h2 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">
                  {group.label}
                </h2>
              ) : null}
              <ul className="flex flex-col divide-y divide-line-hairline">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/exercises/${item.id}`}
                      className="flex min-h-11 items-center justify-between gap-3 py-3 transition-colors active:bg-surface-2"
                    >
                      <span className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-2 text-sm font-medium text-ink-primary">
                          {item.name}
                          {item.hasFullGuidance ? (
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                              role="img"
                              aria-label="Full guidance available"
                              title="Full guidance available"
                            />
                          ) : null}
                        </span>
                        {item.primaryMuscles.length > 0 ? (
                          <span className="text-xs text-ink-tertiary">{item.primaryMuscles.join(", ")}</span>
                        ) : null}
                        {item.equipment && item.equipment.length > 0 ? (
                          <span className="text-[11px] text-ink-tertiary">
                            {item.equipment.map((equipment) => EQUIPMENT_LABELS[equipment]).join(", ")}
                          </span>
                        ) : null}
                      </span>
                      {item.fromProgram ? (
                        <span className="shrink-0 rounded-full border border-line-default px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-secondary">
                          From your program
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
