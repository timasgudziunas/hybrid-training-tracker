import { fetchActiveProgram, fetchProgramHistory } from "./actions";
import SiteHeader from "@/app/site-header";
import ProgramPasteForm from "./program-paste-form";
import ProgramHistoryList from "./program-history-list";
import DeactivateProgramButton from "./deactivate-program-button";

// Per-account data read through the session cookie: never prerender.
export const dynamic = "force-dynamic";

export default async function ProgramPage() {
  const [activeResult, historyResult] = await Promise.all([fetchActiveProgram(), fetchProgramHistory()]);
  const active = activeResult.ok ? activeResult.data : null;
  const history = historyResult.ok ? historyResult.data : [];
  const loadError = !activeResult.ok ? activeResult.reason : !historyResult.ok ? historyResult.reason : null;

  return (
    <div className="flex flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <SiteHeader active="program" />

        {loadError ? (
          <p className="rounded-xl border border-warning/30 bg-warning-soft p-3 text-sm text-warning">
            {loadError} If this is your first time here, apply supabase/schema.sql in the Supabase SQL editor, then reload.
          </p>
        ) : null}

        <div className="flex flex-col gap-1.5 rounded-2xl border border-line-hairline bg-surface-1 p-5 shadow-card">
          {active ? (
            <>
              <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">
                Active program
              </p>
              <p className="font-display text-2xl font-bold text-ink-primary">{active.name}</p>
              <p className="text-xs text-ink-tertiary">Saved {new Date(active.createdAt).toLocaleString()}</p>
              <DeactivateProgramButton activeName={active.name} />
            </>
          ) : (
            <p className="text-sm text-ink-secondary">
              No program is active yet. Today shows a sample workout link until you paste one below.
            </p>
          )}
        </div>

        <p className="text-sm text-ink-secondary">
          See PROGRAM_FORMAT.md in the repo for the full format, or start from the example week there and adjust it.
        </p>

        <ProgramPasteForm />

        <ProgramHistoryList programs={history} activeId={active?.id ?? null} />
      </div>
    </div>
  );
}
