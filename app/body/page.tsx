import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import SiteHeader from "@/app/site-header";
import TodayCheckinSection from "./today-checkin-section";
import CheckinHistory from "./checkin-history";
import WeightTrendChart from "./weight-trend-chart";

export const dynamic = "force-dynamic";

const PHOTO_BUCKET = "progress-photos";
// 30 min: long enough to browse history and open photos without links dying
// mid-session, short enough that a leaked URL isn't durable.
const SIGNED_URL_TTL_SECONDS = 1800;
const HISTORY_LIMIT = 365;
const CHART_WINDOW_DAYS = 90;

type CheckinRow = {
  checkin_date: string;
  weight_lbs: number;
  photo_path: string | null;
};

async function loadHistory(): Promise<{ rows: CheckinRow[]; error: string | null }> {
  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch (err) {
    console.error("[body/page] Supabase client init failed:", err);
    return { rows: [], error: "Storage is not configured." };
  }

  const { data, error } = await supabase
    .from("body_checkins")
    .select("checkin_date, weight_lbs, photo_path")
    .order("checkin_date", { ascending: false })
    .limit(HISTORY_LIMIT);

  if (error) {
    console.error("[body/page] Failed to load body check-ins:", error);
    return { rows: [], error: "Could not load check-in history." };
  }

  return { rows: data ?? [], error: null };
}

async function signPhotoUrls(rows: CheckinRow[]): Promise<Map<string, string>> {
  const paths = rows.map((row) => row.photo_path).filter((path): path is string => Boolean(path));
  if (paths.length === 0) return new Map();

  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch (err) {
    console.error("[body/page] Supabase client init failed:", err);
    return new Map();
  }

  const entries = await Promise.all(
    paths.map(async (path) => {
      const { data, error } = await supabase.storage
        .from(PHOTO_BUCKET)
        .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
      if (error || !data) {
        console.error("[body/page] Failed to sign photo URL:", path, error);
        return null;
      }
      return [path, data.signedUrl] as const;
    })
  );

  return new Map(entries.filter((entry): entry is readonly [string, string] => entry !== null));
}

function isWithinChartWindow(checkinDate: string): boolean {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - CHART_WINDOW_DAYS);
  return new Date(checkinDate) >= cutoff;
}

export default async function BodyPage() {
  const { rows, error } = await loadHistory();
  const photoUrls = await signPhotoUrls(rows);

  const chartData = rows
    .filter((row) => isWithinChartWindow(row.checkin_date))
    .slice()
    .sort((a, b) => a.checkin_date.localeCompare(b.checkin_date));

  return (
    <div className="flex flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <SiteHeader active="body" />

        {error ? (
          <p className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>
        ) : null}

        <TodayCheckinSection />

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">
            Weight trend, 90 days
          </h2>
          <div className="rounded-2xl border border-line-hairline bg-surface-1 p-4 shadow-card sm:p-5">
            <WeightTrendChart data={chartData} />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">History</h2>
          <CheckinHistory rows={rows} photoUrls={photoUrls} />
        </section>
      </div>
    </div>
  );
}
