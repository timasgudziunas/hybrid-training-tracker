import Link from "next/link";
import DailyCheckinPrompt from "./daily-checkin-prompt";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-black px-4 text-white">
      <DailyCheckinPrompt />
      <h1 className="text-2xl font-semibold">Hybrid Training Tracker</h1>
      <p className="text-sm text-zinc-400">Phase 0 scaffold</p>
      <Link href="/body" className="text-sm text-zinc-400 underline hover:text-white">
        Body
      </Link>
    </div>
  );
}
