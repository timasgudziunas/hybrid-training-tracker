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
    <div className="w-full max-w-sm rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-200">Body check-in</h2>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="px-2 text-lg leading-none text-zinc-500 hover:text-zinc-300"
        >
          &times;
        </button>
      </div>
      <CheckinForm date={today} existing={null} onSaved={dismiss} submitLabel="Save" />
    </div>
  );
}
