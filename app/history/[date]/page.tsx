import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchSessionForDate } from "../actions";
import { formatDateLabel } from "./format-date-label";
import SessionDetail from "./session-detail";

export const dynamic = "force-dynamic";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Day drill-down (PLAN.md R4): the full historical record for one calendar
 * date, rendered from that session row's own snapshot. Reached only from a
 * calendar day that has a real (non-sample) session, but the date param is
 * user-navigable directly too, so every branch here is handled explicitly
 * rather than assumed.
 */
export default async function HistoryDayPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;

  if (!DATE_PATTERN.test(date)) {
    notFound();
  }

  const result = await fetchSessionForDate(date);

  return (
    <div className="flex flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <Link
          href="/history"
          className="w-fit text-xs font-medium text-ink-tertiary transition-colors active:text-ink-secondary"
        >
          Back to history
        </Link>

        {!result.ok ? (
          <p className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
            {result.reason}
          </p>
        ) : !result.data ? (
          <div className="flex flex-col gap-1.5 rounded-2xl border border-line-hairline bg-surface-1 p-6 shadow-card">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-ink-tertiary">
              {formatDateLabel(date)}
            </p>
            <p className="text-sm text-ink-secondary">No training session was logged this day.</p>
          </div>
        ) : (
          <SessionDetail record={result.data} />
        )}
      </div>
    </div>
  );
}
