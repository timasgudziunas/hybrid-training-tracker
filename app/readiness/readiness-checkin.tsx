"use client";

import { useEffect, useState } from "react";
import { getLocalDateString } from "@/lib/date/local-date-string";
import {
  getReadinessEntry,
  getRecentReadinessEntries,
  saveReadinessEntry,
  type ReadinessColor,
  type ReadinessEntry,
} from "./actions";
import { groinNoteCopy, groinNoteReason, type GroinTrendEntry } from "./groin-messaging";
import ScaleChips from "./scale-chips";
import ReadinessSummary, { type ReadinessFormValues } from "./readiness-summary";

const ENERGY_OPTIONS = [1, 2, 3, 4, 5] as const;
const SORENESS_OPTIONS = [1, 2, 3, 4, 5] as const;
const GROIN_OPTIONS = [0, 1, 2, 3, 4, 5] as const;
const GROIN_END_LABELS = { 0: "No symptoms", 5: "Significant" };

// How many recent entries to pull alongside today's, just enough to evaluate
// the "increased for 2+ consecutive entries" groin trend rule.
const TREND_LOOKBACK_DAYS = 6;

const READINESS_STATES: {
  value: ReadinessColor;
  label: string;
  dot: string;
  selectedClass: string;
}[] = [
  { value: "green", label: "Ready", dot: "bg-success", selectedClass: "border-success bg-success-soft text-ink-primary" },
  { value: "yellow", label: "Manage", dot: "bg-warning", selectedClass: "border-warning bg-warning-soft text-ink-primary" },
  { value: "red", label: "Back off", dot: "bg-danger", selectedClass: "border-danger bg-danger-soft text-ink-primary" },
];

const EMPTY_FORM: ReadinessFormValues = {
  sleepHours: "",
  energy: null,
  soreness: null,
  groinStatus: null,
  readiness: null,
  notes: "",
};

function entryToForm(entry: ReadinessEntry): ReadinessFormValues {
  return {
    sleepHours: entry.sleepHours !== null ? String(entry.sleepHours) : "",
    energy: entry.energy,
    soreness: entry.soreness,
    groinStatus: entry.groinStatus,
    readiness: entry.readiness,
    notes: entry.notes ?? "",
  };
}

type LoadState = { status: "loading" } | { status: "ready" } | { status: "error"; message: string };

/** Today's check-in card: completable in a few seconds, one screen, no
 * wizard. Saves once; reopening today shows the saved entry with inline
 * edit (PRODUCT_SPEC §13). Computes the device-local date itself, same
 * pattern as app/body/today-checkin-section.tsx, since server time can
 * disagree with the athlete's local calendar date. */
export default function ReadinessCheckin() {
  const [today] = useState(() => getLocalDateString(new Date()));
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [savedToday, setSavedToday] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<ReadinessFormValues>(EMPTY_FORM);
  const [trendEntries, setTrendEntries] = useState<GroinTrendEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [todayResult, recentResult] = await Promise.all([
        getReadinessEntry(today),
        getRecentReadinessEntries(TREND_LOOKBACK_DAYS),
      ]);

      if (cancelled) return;

      if (!todayResult.ok) {
        setLoadState({ status: "error", message: todayResult.reason });
        return;
      }
      if (!recentResult.ok) {
        setLoadState({ status: "error", message: recentResult.reason });
        return;
      }

      if (todayResult.data) {
        setForm(entryToForm(todayResult.data));
        setSavedToday(true);
      } else {
        setForm(EMPTY_FORM);
        setSavedToday(false);
      }

      const priorDays: GroinTrendEntry[] = recentResult.data
        .filter((entry) => entry.date !== today)
        .map((entry) => ({ date: entry.date, groinStatus: entry.groinStatus }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setTrendEntries([...priorDays, { date: today, groinStatus: todayResult.data?.groinStatus ?? null }]);

      setLoadState({ status: "ready" });
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [today, refreshKey]);

  async function handleSave() {
    setIsSaving(true);
    setSaveError(null);

    const sleepHours = form.sleepHours.trim().length > 0 ? Number.parseFloat(form.sleepHours) : null;

    const result = await saveReadinessEntry({
      date: today,
      sleepHours,
      energy: form.energy,
      soreness: form.soreness,
      groinStatus: form.groinStatus,
      readiness: form.readiness,
      notes: form.notes,
    });

    setIsSaving(false);

    if (!result.ok) {
      setSaveError(result.reason);
      return;
    }

    setSavedToday(true);
    setIsEditing(false);
    setRefreshKey((key) => key + 1);
  }

  if (loadState.status === "loading") {
    return (
      <div className="rounded-2xl border border-line-hairline bg-surface-1 p-5 shadow-card">
        <p className="text-sm text-ink-tertiary">Loading...</p>
      </div>
    );
  }

  if (loadState.status === "error") {
    return (
      <div className="rounded-2xl border border-danger/30 bg-danger-soft p-5">
        <p className="text-sm text-danger">{loadState.message}</p>
      </div>
    );
  }

  const reason = groinNoteReason(trendEntries);
  const note = groinNoteCopy(reason);
  const showForm = !savedToday || isEditing;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-line-hairline bg-surface-1 p-5 shadow-card sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-ink-secondary">
            Today&rsquo;s readiness
          </h2>
          {savedToday ? (
            <button
              type="button"
              onClick={() => setIsEditing((editing) => !editing)}
              className="rounded-lg border border-line-default px-3 py-1.5 text-sm font-medium text-ink-secondary transition-colors hover:text-ink-primary"
            >
              {isEditing ? "Cancel" : "Edit"}
            </button>
          ) : null}
        </div>

        {showForm ? (
          <div className="mt-4 flex flex-col gap-6">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">Sleep (hours)</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.5"
                min="0"
                max="24"
                value={form.sleepHours}
                onChange={(e) => setForm((f) => ({ ...f, sleepHours: e.target.value }))}
                className="h-14 w-32 rounded-xl border border-line-default bg-surface-2 px-4 font-display text-2xl tabular-nums text-ink-primary shadow-well transition-colors focus:border-accent focus:outline-none"
              />
            </label>

            <ScaleChips
              label="Energy"
              options={ENERGY_OPTIONS}
              value={form.energy}
              onChange={(value) => setForm((f) => ({ ...f, energy: value }))}
            />

            <ScaleChips
              label="Soreness"
              options={SORENESS_OPTIONS}
              value={form.soreness}
              onChange={(value) => setForm((f) => ({ ...f, soreness: value }))}
            />

            <ScaleChips
              label="Groin / adductor status"
              options={GROIN_OPTIONS}
              value={form.groinStatus}
              onChange={(value) => setForm((f) => ({ ...f, groinStatus: value }))}
              endLabels={GROIN_END_LABELS}
            />

            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">Overall readiness</span>
              <div className="grid grid-cols-3 gap-2">
                {READINESS_STATES.map((state) => {
                  const selected = form.readiness === state.value;
                  return (
                    <button
                      key={state.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, readiness: selected ? null : state.value }))}
                      aria-pressed={selected}
                      className={`flex h-16 flex-col items-center justify-center gap-1 rounded-xl border font-medium transition-colors ${
                        selected ? state.selectedClass : "border-line-default text-ink-secondary active:bg-surface-2"
                      }`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${state.dot}`} />
                      <span className="text-sm">{state.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">Note (optional)</span>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="rounded-xl border border-line-default bg-surface-2 p-3 text-sm text-ink-primary shadow-well transition-colors focus:border-accent focus:outline-none"
              />
            </label>

            {saveError ? <p className="text-sm text-danger">{saveError}</p> : null}

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="h-14 rounded-xl bg-accent text-base font-semibold text-accent-ink transition-colors active:bg-accent-strong disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        ) : (
          <ReadinessSummary form={form} />
        )}
      </div>

      {note ? (
        <div className="rounded-2xl border border-warning/30 bg-warning-soft p-4">
          <p className="text-sm text-ink-primary">{note}</p>
        </div>
      ) : null}
    </div>
  );
}
