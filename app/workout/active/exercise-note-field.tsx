"use client";

import { useState } from "react";

/** Brief per-exercise note (TRAINING_SYSTEM.md §6 / PRODUCT_SPEC §6). Inline,
 * collapsed by default so it never competes with the set-logging fields. */
export default function ExerciseNoteField({
  note,
  onChange,
}: {
  note: string | undefined;
  onChange: (value: string) => void;
}) {
  const [expanded, setExpanded] = useState(Boolean(note));

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="self-start text-xs font-medium text-ink-tertiary transition-colors active:text-ink-secondary"
      >
        + Add note
      </button>
    );
  }

  return (
    <input
      type="text"
      value={note ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Note"
      autoFocus
      className="rounded-lg border border-line-default bg-surface-2 px-3 py-2 text-sm text-ink-primary focus:border-accent focus:outline-none"
    />
  );
}
