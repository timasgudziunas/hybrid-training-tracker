"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "./exercise-category-copy";
import type { LibraryExerciseEntry } from "./merge-exercise-sources";

/**
 * Client-side name filter plus the category-grouped exercise list
 * (PLAN.md R6 / old Phase 8). All entries are passed down from the server
 * component in one shot (58 catalog entries plus a handful of program-only
 * ones at most), so filtering stays a plain in-memory string match with no
 * extra fetch.
 */
export default function ExerciseLibraryBrowser({ entries }: { entries: LibraryExerciseEntry[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return entries;
    return entries.filter((entry) => entry.name.toLowerCase().includes(normalizedQuery));
  }, [entries, query]);

  const groups = useMemo(() => {
    return CATEGORY_ORDER.map((category) => ({
      category,
      label: CATEGORY_LABELS[category],
      items: filtered
        .filter((entry) => entry.category === category)
        .sort((a, b) => a.name.localeCompare(b.name)),
    })).filter((group) => group.items.length > 0);
  }, [filtered]);

  return (
    <div className="flex flex-col gap-6">
      <label className="flex flex-col gap-1.5">
        <span className="sr-only">Search exercises</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises"
          className="h-12 rounded-xl border border-line-default bg-surface-2 px-4 text-sm text-ink-primary shadow-well transition-colors focus:border-accent focus:outline-none"
        />
      </label>

      {groups.length === 0 ? (
        <p className="text-sm text-ink-secondary">No exercises match that search.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {groups.map((group) => (
            <section
              key={group.category}
              className="flex flex-col gap-2 rounded-2xl border border-line-hairline bg-surface-1 p-5 shadow-card"
            >
              <h2 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">
                {group.label}
              </h2>
              <ul className="flex flex-col divide-y divide-line-hairline">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/exercises/${item.id}`}
                      className="flex items-center justify-between gap-3 py-3 transition-colors active:bg-surface-2"
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
