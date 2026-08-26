import Link from "next/link";
import DailyCheckinPrompt from "./daily-checkin-prompt";
import TodayWorkout from "./today/today-workout";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-black px-4 py-8 text-white">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-medium text-zinc-400">Hybrid Training Tracker</h1>
          <div className="flex items-center gap-4">
            <Link href="/program" className="text-sm text-zinc-400 hover:text-white">
              Program
            </Link>
            <Link href="/body" className="text-sm text-zinc-400 hover:text-white">
              Body
            </Link>
          </div>
        </div>

        <DailyCheckinPrompt />
        <TodayWorkout />
      </div>
    </div>
  );
}
