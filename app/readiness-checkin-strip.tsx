"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getLocalDateString } from "@/lib/date/local-date-string";
import { getReadinessEntry } from "@/app/readiness/actions";

type StripState = "checking" | "hidden" | "visible";

/**
 * Homepage's one quiet addition beyond the Today card (R8, dashboard
 * restraint): a single small link-row to the readiness check-in, shown only
 * when today's device-local date has no entry yet. Deliberately lighter than
 * DailyCheckinPrompt (no card, no form) — this never blocks or meaningfully
 * pushes down the workout card since it always renders after it, and renders
 * nothing at all once today's entry exists.
 */
export default function ReadinessCheckinStrip() {
  const [today] = useState(() => getLocalDateString(new Date()));
  const [state, setState] = useState<StripState>("checking");

  useEffect(() => {
    let cancelled = false;

    getReadinessEntry(today)
      .then((result) => {
        if (cancelled) return;
        setState(result.ok && result.data === null ? "visible" : "hidden");
      })
      .catch(() => {
        if (!cancelled) setState("hidden");
      });

    return () => {
      cancelled = true;
    };
  }, [today]);

  if (state !== "visible") {
    return null;
  }

  return (
    <Link
      href="/readiness"
      className="flex items-center justify-between gap-2 px-1 text-sm text-ink-tertiary transition-colors hover:text-ink-secondary"
    >
      <span>Morning readiness check-in</span>
      <span aria-hidden="true">&rarr;</span>
    </Link>
  );
}
