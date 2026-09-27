import { fetchActiveProgram } from "@/app/program/actions";
import type { ActiveProgramWeek } from "@/lib/history/day-classification";
import { activeSinceDateFromCreatedAt } from "@/lib/history/active-since-date";
import { fetchBodyCheckinDates, fetchSessionSummaries } from "./actions";
import { fetchUltimatePracticeDates } from "@/app/today/ultimate-practice-actions";
import HistoryCalendarClient from "./history-calendar-client";
import SiteHeader from "@/app/site-header";

export const dynamic = "force-dynamic";

/**
 * Server-fetches everything History needs: the active program (to shade
 * scheduled training/rest days and compute adherence), every session
 * summary (the client picks one representative row per date and excludes
 * sample-workout rows — see lib/history/session-filtering.ts), and body
 * check-in dates for the calendar's small secondary indicator. "Today" and
 * the visible month stay client-side (see HistoryCalendarClient) since the
 * server renders in UTC, which can disagree with the athlete's local
 * calendar date.
 */
export default async function HistoryPage() {
  const [programResult, sessionsResult, checkinsResult, ultimatePracticeResult] = await Promise.all([
    fetchActiveProgram(),
    fetchSessionSummaries(),
    fetchBodyCheckinDates(),
    fetchUltimatePracticeDates(),
  ]);

  const errors: string[] = [];
  if (!programResult.ok) errors.push(programResult.reason);
  if (!sessionsResult.ok) errors.push(sessionsResult.reason);

  const activeProgramRecord = programResult.ok ? programResult.data : null;
  const program: ActiveProgramWeek | null = activeProgramRecord
    ? {
        templates: activeProgramRecord.parsed.templates,
        activeSinceDate: activeSinceDateFromCreatedAt(activeProgramRecord.createdAt),
      }
    : null;

  const sessions = sessionsResult.ok ? sessionsResult.data : [];
  const bodyCheckinDates = checkinsResult.ok ? checkinsResult.data : [];
  const ultimatePracticeDates = ultimatePracticeResult.ok ? ultimatePracticeResult.data : [];

  return (
    <div className="flex flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <SiteHeader active="history" />

        <div className="flex flex-col gap-1.5">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-ink-tertiary">History</p>
          <h1 className="font-display text-3xl font-bold text-ink-primary sm:text-4xl">Training calendar</h1>
        </div>

        {errors.length > 0 ? (
          <p className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
            {errors.join(" ")}
          </p>
        ) : null}

        <HistoryCalendarClient
          sessions={sessions}
          bodyCheckinDates={bodyCheckinDates}
          ultimatePracticeDates={ultimatePracticeDates}
          program={program}
        />
      </div>
    </div>
  );
}
