import type { Weekday } from "@/lib/program/program-types";
import ActiveWorkoutScreen from "./active-workout-screen";

const WEEKDAYS: readonly Weekday[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

/** Optional `?day=<weekday>` override: start a DIFFERENT program day than the
 * device's weekday (a missed session made up the next day). Only consulted
 * when a brand-new session is created; an in-flight session always resumes
 * as-is. Anything that is not a weekday name is ignored. */
function parseDayOverride(value: string | string[] | undefined): Weekday | null {
  if (typeof value !== "string") return null;
  const lower = value.toLowerCase();
  return (WEEKDAYS as readonly string[]).includes(lower) ? (lower as Weekday) : null;
}

export default async function ActiveWorkoutPage(props: PageProps<"/workout/active">) {
  const searchParams = await props.searchParams;
  const source = searchParams.source === "sample" ? "sample" : "program";
  const dayOverride = parseDayOverride(searchParams.day);

  return (
    <div className="flex flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <ActiveWorkoutScreen source={source} dayOverride={dayOverride} />
      </div>
    </div>
  );
}
