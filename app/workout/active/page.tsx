import ActiveWorkoutScreen from "./active-workout-screen";

const MAKE_UP_FOR_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Optional `?makeUpFor=yyyy-mm-dd` param: start a session for a training day
 * missed within the make-up window (owner decision 2026-09-27, see
 * lib/workout-session/make-up-candidates.ts) instead of the device's own
 * weekday. Only ever consulted when a brand-new PROGRAM session is created
 * (never the sample, never a resumed session) — active-workout-screen.tsx
 * validates it with the same rule that offered it on Today, so a stale or
 * tampered link is silently ignored rather than trusted. Anything that
 * isn't a plain yyyy-mm-dd string is discarded here.
 */
function parseMakeUpFor(value: string | string[] | undefined): string | null {
  if (typeof value !== "string") return null;
  return MAKE_UP_FOR_PATTERN.test(value) ? value : null;
}

export default async function ActiveWorkoutPage(props: PageProps<"/workout/active">) {
  const searchParams = await props.searchParams;
  const source = searchParams.source === "sample" ? "sample" : "program";
  const makeUpFor = parseMakeUpFor(searchParams.makeUpFor);

  return (
    <div className="flex flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <ActiveWorkoutScreen source={source} makeUpFor={makeUpFor} />
      </div>
    </div>
  );
}
