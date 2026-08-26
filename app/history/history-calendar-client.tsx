"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { getLocalDateString } from "@/lib/date/local-date-string";
import {
  addMonths,
  buildMonthGrid,
  monthOfDateString,
  weekdayOfDateString,
} from "@/lib/history/calendar-grid";
import { classifyDay, type ActiveProgramWeek } from "@/lib/history/day-classification";
import { computeAdherence } from "@/lib/history/adherence";
import { groupSessionsByDate } from "@/lib/history/session-filtering";
import type { SessionSummary } from "./actions";
import AdherenceCard from "./adherence-card";
import CalendarLegend from "./calendar-legend";
import CalendarDayCell from "./calendar-day-cell";

const WEEKDAY_HEADER_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// There's nothing external to subscribe to: the device-local "today" only
// needs to be read once per mount, same reasoning as
// app/today/today-workout-client.tsx.
function subscribeToNothing(): () => void {
  return () => {};
}

function getClientToday(): string {
  return getLocalDateString(new Date());
}

// The server renders in UTC, which can disagree with the athlete's local
// calendar date, so it must never guess "today" — this matches the null
// first-hydration render exactly, then useSyncExternalStore swaps in the
// real device-local date immediately after hydration.
function getServerToday(): null {
  return null;
}

export default function HistoryCalendarClient({
  sessions,
  bodyCheckinDates,
  program,
}: {
  sessions: SessionSummary[];
  bodyCheckinDates: string[];
  program: ActiveProgramWeek | null;
}) {
  const today = useSyncExternalStore(subscribeToNothing, getClientToday, getServerToday);
  const [monthOverride, setMonthOverride] = useState<{ year: number; monthIndex: number } | null>(null);

  const sessionByDate = useMemo(() => groupSessionsByDate(sessions), [sessions]);
  const bodyCheckinDateSet = useMemo(() => new Set(bodyCheckinDates), [bodyCheckinDates]);

  if (today === null) {
    return <div className="h-[30rem] w-full animate-pulse rounded-2xl bg-surface-1" aria-hidden="true" />;
  }

  const activeMonth = monthOverride ?? monthOfDateString(today);
  const grid = buildMonthGrid(activeMonth.year, activeMonth.monthIndex);

  const adherence = computeAdherence({
    today,
    program,
    sessionByDate,
    getWeekday: weekdayOfDateString,
  });

  function goToMonth(delta: number) {
    setMonthOverride(addMonths(activeMonth.year, activeMonth.monthIndex, delta));
  }

  const hasAnyRealSession = sessionByDate.size > 0;

  return (
    <div className="flex flex-col gap-6">
      <AdherenceCard adherence={adherence} hasProgram={program !== null} />

      <div className="flex flex-col gap-4 rounded-2xl border border-line-hairline bg-surface-1 p-5 shadow-card sm:p-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => goToMonth(-1)}
            aria-label="Previous month"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-line-default text-ink-secondary transition-colors active:bg-surface-2"
          >
            <ChevronIcon direction="left" />
          </button>
          <h2 className="font-display text-xl font-bold text-ink-primary">{grid.label}</h2>
          <button
            type="button"
            onClick={() => goToMonth(1)}
            aria-label="Next month"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-line-default text-ink-secondary transition-colors active:bg-surface-2"
          >
            <ChevronIcon direction="right" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wide text-ink-tertiary">
          {WEEKDAY_HEADER_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="flex flex-col gap-1">
          {grid.weeks.map((week) => (
            <div key={week[0].date} className="grid grid-cols-7 gap-1">
              {week.map((cell) => {
                const classification = classifyDay({
                  date: cell.date,
                  today,
                  weekday: cell.weekday,
                  program,
                  session: sessionByDate.get(cell.date) ?? null,
                  hasBodyCheckin: bodyCheckinDateSet.has(cell.date),
                });
                return (
                  <CalendarDayCell
                    key={cell.date}
                    day={cell.day}
                    inCurrentMonth={cell.inCurrentMonth}
                    classification={classification}
                  />
                );
              })}
            </div>
          ))}
        </div>

        <CalendarLegend />
      </div>

      {!hasAnyRealSession ? (
        <p className="text-sm text-ink-tertiary">
          No sessions logged yet.{" "}
          {program
            ? "Rest and scheduled training days are already shaded above."
            : "Paste a program to see scheduled training days shaded here."}
        </p>
      ) : null}
    </div>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  const d = direction === "left" ? "M12.5 4L6.5 10L12.5 16" : "M7.5 4L13.5 10L7.5 16";
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d={d} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
