import SiteHeader from "@/app/site-header";
import SettingsForm from "./settings-form";
import { fetchAthleteSettings } from "./actions";
import { DEFAULT_ATHLETE_SETTINGS } from "@/lib/settings/athlete-settings";

// Live Supabase data, read fresh on every request (same posture as
// app/body/page.tsx and app/readiness/page.tsx).
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const result = await fetchAthleteSettings();
  const settings = result.ok ? result.data : DEFAULT_ATHLETE_SETTINGS;

  return (
    <div className="flex flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <SiteHeader active="settings" />

        <header className="flex flex-col gap-1">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">
            Preferences
          </p>
          <h1 className="font-display text-3xl font-bold text-ink-primary">Settings</h1>
          <p className="text-sm text-ink-tertiary">How the app behaves for you. Synced across your devices.</p>
        </header>

        {!result.ok ? (
          <p className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
            {result.reason}
          </p>
        ) : null}

        <SettingsForm initial={settings} />
      </div>
    </div>
  );
}
