"use client";

import { activeSinceDateFromCreatedAt } from "@/lib/history/active-since-date";
import { useEffect, useState } from "react";
import { getLocalDateString } from "@/lib/date/local-date-string";
import { addDays } from "@/lib/history/calendar-grid";
import { groupSessionsByDate } from "@/lib/history/session-filtering";
import type { ActiveProgramWeek } from "@/lib/history/day-classification";
import { fetchActiveProgram } from "@/app/program/actions";
import { fetchBodyweightSeries, type BodyweightPoint } from "@/app/body/bodyweight-series-actions";
import { fetchUltimatePracticeDates } from "@/app/today/ultimate-practice-actions";
import { fetchSessionRecordsInRange } from "./actions";
import type { WorkoutSessionRecord } from "@/lib/workout-session/workout-session-types";
import WeeklyReview from "./weekly-review";
import MonthlyReview from "./monthly-review";

// The trailing window monthly review needs; weekly review is just the last
// 7 days of this same fetch, so nothing is fetched twice.
const MONTH_WINDOW_DAYS = 28;

type Tab = "week" | "month";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      today: string;
      program: ActiveProgramWeek | null;
      sessions: WorkoutSessionRecord[];
      sessionByDate: Map<string, WorkoutSessionRecord>;
      bodyweightSeries: BodyweightPoint[];
      ultimatePracticeDates: string[];
    };

/**
 * Orchestrates the Review dashboard's data fetch (R8, old Phase 10). "Today"
 * must be resolved client-side (device-local, not server UTC — same
 * reasoning as app/history/history-calendar-client.tsx), which in turn
 * decides both review windows, so the fetch itself runs here rather than in
 * a Server Component parent.
 */
export default function ReviewDashboard() {
  const [tab, setTab] = useState<Tab>("week");
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    const today = getLocalDateString(new Date());
    const monthStart = addDays(today, -(MONTH_WINDOW_DAYS - 1));

    async function load() {
      const [programResult, sessionsResult, bodyweightResult, ultimatePracticeResult] = await Promise.all([
        fetchActiveProgram(),
        fetchSessionRecordsInRange(monthStart, today),
        fetchBodyweightSeries(),
        fetchUltimatePracticeDates(monthStart, today),
      ]);

      if (cancelled) return;

      if (!sessionsResult.ok) {
        setState({ status: "error", message: sessionsResult.reason });
        return;
      }

      const activeProgramRecord = programResult.ok ? programResult.data : null;
      const program: ActiveProgramWeek | null = activeProgramRecord
        ? {
            templates: activeProgramRecord.parsed.templates,
            activeSinceDate: activeSinceDateFromCreatedAt(activeProgramRecord.createdAt),
          }
        : null;

      const sessions = sessionsResult.data;

      // groupSessionsByDate keys by EFFECTIVE date (session-filtering.ts):
      // for a make-up session that is performance.makeUpForDate, otherwise
      // the performed sessionDate. WorkoutSessionRecord itself has no
      // top-level makeUpForDate (it lives in the performance jsonb), so it
      // has to be pulled out here for grouping, exactly like
      // app/history/actions.ts does for the day drill-down — otherwise a
      // made-up day would bucket under the day it was performed and the
      // adherence math below would keep reading it as missed.
      const sessionByDate = groupSessionsByDate(
        sessions.map((session) => ({ ...session, makeUpForDate: session.performance.makeUpForDate ?? null }))
      );

      setState({
        status: "ready",
        today,
        program,
        sessions,
        sessionByDate,
        bodyweightSeries: bodyweightResult.ok ? bodyweightResult.data : [],
        ultimatePracticeDates: ultimatePracticeResult.ok ? ultimatePracticeResult.data : [],
      });
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return <div className="h-64 w-full animate-pulse rounded-2xl bg-surface-1" aria-hidden="true" />;
  }

  if (state.status === "error") {
    return (
      <p className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
        {state.message}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-1 rounded-xl border border-line-hairline bg-surface-1 p-1">
        <TabButton label="This week" isActive={tab === "week"} onClick={() => setTab("week")} />
        <TabButton label="This month" isActive={tab === "month"} onClick={() => setTab("month")} />
      </div>

      {tab === "week" ? (
        <WeeklyReview
          today={state.today}
          program={state.program}
          sessions={state.sessions}
          sessionByDate={state.sessionByDate}
          bodyweightSeries={state.bodyweightSeries}
          ultimatePracticeDates={state.ultimatePracticeDates}
        />
      ) : (
        <MonthlyReview
          today={state.today}
          program={state.program}
          sessions={state.sessions}
          sessionByDate={state.sessionByDate}
          bodyweightSeries={state.bodyweightSeries}
        />
      )}
    </div>
  );
}

function TabButton({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
        isActive ? "bg-surface-2 text-ink-primary" : "text-ink-tertiary hover:text-ink-secondary"
      }`}
    >
      {label}
    </button>
  );
}
