import Link from "next/link";
import { fetchActiveProgram, fetchProgramHistory } from "./actions";
import ProgramPasteForm from "./program-paste-form";
import ProgramHistoryList from "./program-history-list";

export default async function ProgramPage() {
  const [activeResult, historyResult] = await Promise.all([fetchActiveProgram(), fetchProgramHistory()]);
  const active = activeResult.ok ? activeResult.data : null;
  const history = historyResult.ok ? historyResult.data : [];
  const loadError = !activeResult.ok ? activeResult.reason : !historyResult.ok ? historyResult.reason : null;

  return (
    <div className="flex flex-1 flex-col bg-black px-4 py-8 text-white">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-medium text-zinc-400">Program</h1>
          <Link href="/" className="text-sm text-zinc-400 hover:text-white">
            Today
          </Link>
        </div>

        {loadError ? (
          <p className="rounded-md border border-amber-900 bg-amber-950/30 p-3 text-sm text-amber-300">
            {loadError} If this is your first time here, apply supabase/schema.sql in the Supabase SQL editor, then reload.
          </p>
        ) : null}

        <div className="flex flex-col gap-1">
          {active ? (
            <>
              <p className="text-xs uppercase tracking-widest text-zinc-500">Active program</p>
              <p className="text-lg font-semibold text-white">{active.name}</p>
              <p className="text-xs text-zinc-500">Saved {new Date(active.createdAt).toLocaleString()}</p>
            </>
          ) : (
            <p className="text-sm text-zinc-400">
              No program is active yet. Today shows a sample workout link until you paste one below.
            </p>
          )}
        </div>

        <p className="text-sm text-zinc-400">
          See PROGRAM_FORMAT.md in the repo for the full format, or start from the example week there and adjust it.
        </p>

        <ProgramPasteForm />

        <ProgramHistoryList programs={history} activeId={active?.id ?? null} />
      </div>
    </div>
  );
}
