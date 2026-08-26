"use client";

import { useEffect, useState } from "react";
import { getLocalDateString } from "@/lib/date/local-date-string";
import { addDays } from "@/lib/history/calendar-grid";
import { groupSessionsByDate } from "@/lib/history/session-filtering";
import type { ActiveProgramWeek } from "@/lib/history/day-classification";
import { fetchActiveProgram } from "@/app/program/actions";
import { getRecentReadinessEntries, type ReadinessEntry } from "@/app/readiness/actions";
import { fetchBenchmarkEntries, fetchBodyweightSeries, type BenchmarkEntry, type BodyweightPoint } from "@/app/progress/actions";
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
      readinessEntries: ReadinessEntry[];
      bodyweightSeries: BodyweightPoint[];
      benchmarkEntries: Record<string, BenchmarkEntry[]>;
    };

// Same day-granularity approximation app/history/page.tsx uses: a true
// device-local date isn't knowable for a past server timestamp.
function activeSinceDateFromCreatedAt(createdAt: string): string {
  return new Date(createdAt).toISOString().slice(0, 10);
}

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
      const [programResult, sessionsResult, readinessResult, bodyweightResult, benchmarkResult] = await Promise.all([
        fetchActiveProgram(),
        fetchSessionRecordsInRange(monthStart, today),
        getRecentReadinessEntries(MONTH_WINDOW_DAYS),
        fetchBodyweightSeries(),
        fetchBenchmarkEntries(),
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

      setState({
        status: "ready",
        today,
        program,
        sessions,
        sessionByDate: groupSessionsByDate(sessions),
        readinessEntries: readinessResult.ok ? readinessResult.data : [],
        bodyweightSeries: bodyweightResult.ok ? bodyweightResult.data : [],
        benchmarkEntries: benchmarkResult.ok ? benchmarkResult.data.entries : {},
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
          readinessEntries={state.readinessEntries}
          bodyweightSeries={state.bodyweightSeries}
        />
      ) : (
        <MonthlyReview
          today={state.today}
          program={state.program}
          sessions={state.sessions}
          sessionByDate={state.sessionByDate}
          readinessEntries={state.readinessEntries}
          bodyweightSeries={state.bodyweightSeries}
          benchmarkEntries={state.benchmarkEntries}
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
