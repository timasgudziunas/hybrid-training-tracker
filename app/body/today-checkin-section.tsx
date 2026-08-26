"use client";

import { useEffect, useState } from "react";
import CheckinForm from "./checkin-form";
import { getCheckinByDate } from "./actions";
import { getLocalDateString } from "@/lib/date/local-date-string";

type ExistingEntry = { weightLbs: number; hasPhoto: boolean } | null;
type LoadState =
  | { status: "loading" }
  | { status: "ready"; existing: ExistingEntry }
  | { status: "error" };

export default function TodayCheckinSection() {
  // Computed once via lazy init (client-only value).
  const [today] = useState(() => getLocalDateString(new Date()));
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function resolveTodayEntry(): Promise<LoadState> {
      try {
        const result = await getCheckinByDate(today);
        if (result.error) {
          return { status: "error" };
        }
        return {
          status: "ready",
          existing:
            result.exists && result.weightLbs !== null
              ? { weightLbs: result.weightLbs, hasPhoto: result.hasPhoto }
              : null,
        };
      } catch {
        return { status: "error" };
      }
    }

    resolveTodayEntry().then((next) => {
      if (!cancelled) setLoadState(next);
    });

    return () => {
      cancelled = true;
    };
  }, [today, refreshKey]);

  if (loadState.status === "loading") {
    return null;
  }

  if (loadState.status === "error") {
    return <p className="text-sm text-red-400">Could not load today&rsquo;s check-in.</p>;
  }

  // Today already logged: nothing to show here — the entry lives in the
  // history list below, where it can be edited like any other day.
  if (loadState.existing) {
    return null;
  }

  return (
    <section className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      <h2 className="text-sm font-medium text-zinc-200">Log today&rsquo;s entry</h2>
      <CheckinForm
        key={refreshKey}
        date={today}
        existing={null}
        submitLabel="Save"
        onSaved={() => setRefreshKey((key) => key + 1)}
      />
    </section>
  );
}
