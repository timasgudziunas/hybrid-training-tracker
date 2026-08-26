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
        className="self-start text-xs text-zinc-500 active:text-zinc-300"
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
      className="rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-300"
    />
  );
}
