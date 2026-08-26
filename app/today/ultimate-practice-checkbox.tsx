"use client";

import { useEffect, useState } from "react";
import { getLocalDateString } from "@/lib/date/local-date-string";
import { getUltimatePracticeDay, setUltimatePracticeAttended } from "./ultimate-practice-actions";

type LoadState = "loading" | "ready" | "error";

/**
 * Today screen's explicit Ultimate practice attendance check-in (2026-08-26).
 * The program flag only means practice is SCHEDULED that day; this row is
 * where the athlete records that it actually happened. Follows the
 * cancelled-flag effect pattern from app/readiness-checkin-strip.tsx.
 */
export default function UltimatePracticeCheckbox({ scheduled }: { scheduled: boolean }) {
  const [today] = useState(() => getLocalDateString(new Date()));
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [checked, setChecked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getUltimatePracticeDay(today)
      .then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setChecked(result.data);
          setLoadState("ready");
        } else {
          setLoadState("error");
        }
      })
      .catch(() => {
        if (!cancelled) setLoadState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [today]);

  async function handleToggle() {
    if (isSaving || loadState !== "ready") return;

    const next = !checked;
    const previous = checked;
    setChecked(next);
    setIsSaving(true);

    const result = await setUltimatePracticeAttended(today, next);

    setIsSaving(false);

    if (!result.ok) {
      setChecked(previous);
      setSaveError("Could not save. Check your connection and try again.");
      return;
    }

    setSaveError(null);
  }

  const disabled = loadState !== "ready" || isSaving;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        className={`flex items-center gap-3 rounded-xl border border-line-hairline bg-surface-1 px-4 py-3 ${
          disabled ? "" : "cursor-pointer"
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={handleToggle}
          className="h-6 w-6 shrink-0 rounded-md border-line-default accent-accent disabled:opacity-50"
        />
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-ink-primary">Went to Ultimate practice today</span>
          {scheduled ? (
            <span className="text-xs text-ink-tertiary">
              Scheduled in your program. It counts only when checked.
            </span>
          ) : null}
        </span>
      </label>
      {saveError ? <p className="px-1 text-xs text-danger">{saveError}</p> : null}
    </div>
  );
}
