import type { Prescription } from "@/lib/program/program-types";
import type { SetLog } from "@/lib/workout-session/workout-session-types";

function formatSetLine(set: SetLog, prescriptionType: Prescription["type"]): string | null {
  if (prescriptionType === "repetitions" && set.weight !== undefined && set.reps !== undefined) {
    return `${set.weight} x ${set.reps}`;
  }
  if ((prescriptionType === "hold" || prescriptionType === "duration") && set.seconds !== undefined) {
    return `${set.seconds}s`;
  }
  if (prescriptionType === "distance") {
    return set.timeSeconds !== undefined ? `${set.timeSeconds}s` : "done";
  }
  return null;
}

/** "LAST TIME" (PRODUCT_SPEC §7): always visible while lifting so the
 * athlete almost never needs to search history mid-session. */
export default function PreviousPerformanceSummary({
  previousSets,
  prescriptionType,
}: {
  previousSets: SetLog[] | undefined;
  prescriptionType: Prescription["type"];
}) {
  if (prescriptionType === "qualitative") {
    return null;
  }

  if (!previousSets || previousSets.length === 0) {
    return <p className="text-xs text-ink-tertiary">First time, no history yet</p>;
  }

  const lines = previousSets.map((set) => formatSetLine(set, prescriptionType)).filter(Boolean);

  if (lines.length === 0) {
    return <p className="text-xs text-ink-tertiary">First time, no history yet</p>;
  }

  return (
    <div className="flex flex-col gap-1 rounded-xl border border-line-hairline bg-surface-2 px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">Last time</p>
      <div className="flex flex-col font-display text-lg font-semibold tabular-nums text-ink-secondary">
        {lines.map((line, index) => (
          <span key={index}>{line}</span>
        ))}
      </div>
    </div>
  );
}
