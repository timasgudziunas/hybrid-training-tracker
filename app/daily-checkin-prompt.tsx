"use client";

import { useEffect, useState } from "react";
import { getCheckinByDate } from "@/app/body/actions";
import CheckinForm from "@/app/body/checkin-form";
import { getLocalDateString } from "@/lib/date/local-date-string";

type PromptState = "checking" | "hidden" | "visible";

function dismissedKeyFor(date: string): string {
  return `htt-checkin-dismissed-${date}`;
}

export default function DailyCheckinPrompt() {
  // Computed once via lazy init (client-only value; irrelevant to the
  // initial "checking" render, which renders nothing regardless of date).
  const [today] = useState(() => getLocalDateString(new Date()));
  const [state, setState] = useState<PromptState>("checking");

  useEffect(() => {
    let cancelled = false;

    async function resolveVisibility(): Promise<PromptState> {
      try {
        if (window.localStorage.getItem(dismissedKeyFor(today))) {
          return "hidden";
        }
      } catch {
        // localStorage unavailable (private mode, etc.) - fall through and
        // still offer the prompt; worst case it can reappear this session.
      }

      try {
        const result = await getCheckinByDate(today);
        return result.exists ? "hidden" : "visible";
      } catch {
        return "hidden";
      }
    }

    resolveVisibility().then((next) => {
      if (!cancelled) setState(next);
    });

    return () => {
      cancelled = true;
    };
  }, [today]);

  if (state !== "visible") {
    return null;
  }

  const dismiss = () => {
    try {
      window.localStorage.setItem(dismissedKeyFor(today), "1");
    } catch {
      // Best effort only; not having this stored just means the prompt may
      // reappear later today, which is harmless.
    }
    setState("hidden");
  };

  return (
    <div className="w-full rounded-2xl border border-line-hairline bg-surface-1 p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <p className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">Daily check-in</p>
          <h2 className="text-sm font-semibold text-ink-primary">Log today&rsquo;s bodyweight</h2>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-tertiary transition-colors hover:bg-surface-2 hover:text-ink-primary"
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <CheckinForm date={today} existing={null} onSaved={dismiss} submitLabel="Save" />
    </div>
  );
}
