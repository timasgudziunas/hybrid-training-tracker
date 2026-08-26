import { getRecentReadinessEntries } from "./actions";
import ReadinessCheckin from "./readiness-checkin";
import ReadinessHistory from "./readiness-history";

// Live Supabase data, read fresh on every request (same posture as
// app/body/page.tsx).
export const dynamic = "force-dynamic";

const HISTORY_DAYS = 14;

// Standalone route for now: this page intentionally does not render
// SiteHeader or add itself to app/site-header.tsx's nav union. Surfacing
// readiness on the home page and in navigation happens in a later
// integration pass, per this feature's build instructions.
export default async function ReadinessPage() {
  const recent = await getRecentReadinessEntries(HISTORY_DAYS);
  const entries = recent.ok ? recent.data : [];
  const loadError = recent.ok ? null : recent.reason;

  return (
    <div className="flex flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <header className="flex flex-col gap-1">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">Check in</p>
          <h1 className="font-display text-3xl font-bold text-ink-primary">Readiness</h1>
        </header>

        {loadError ? (
          <p className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">{loadError}</p>
        ) : null}

        <ReadinessCheckin />

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">
            Last two weeks
          </h2>
          <ReadinessHistory entries={entries} />
        </section>
      </div>
    </div>
  );
}
