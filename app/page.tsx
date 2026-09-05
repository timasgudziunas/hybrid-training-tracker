import DailyCheckinPrompt from "./daily-checkin-prompt";
import TodayWorkout from "./today/today-workout";
import SiteHeader from "./site-header";
import ReadinessCheckinStrip from "./readiness-checkin-strip";

// Per-account data read through the session cookie: never prerender.
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <SiteHeader active="today" />
        <DailyCheckinPrompt />
        <TodayWorkout />
        <ReadinessCheckinStrip />
      </div>
    </div>
  );
}
