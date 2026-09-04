import type { Prescription } from "@/lib/program/program-types";
import type { SetLog } from "@/lib/workout-session/workout-session-types";
import { formatLoggedSet } from "@/lib/workout-session/format-logged-set";

/** "LAST TIME" (PRODUCT_SPEC §7): always visible while lifting so the
 * athlete almost never needs to search history mid-session. Cardio slots
 * (app/workout/active/cardio-entry-card.tsx) can be authored as either a
 * qualitative or a duration prescription, so `qualitative` no longer
 * unconditionally hides the panel: it still renders when previous cardio
 * sets exist, giving the athlete a concrete number (watts, speed) to beat. */
export default function PreviousPerformanceSummary({
  previousSets,
  prescriptionType,
}: {
  previousSets: SetLog[] | undefined;
  prescriptionType: Prescription["type"];
}) {
  if (prescriptionType === "qualitative" && (!previousSets || previousSets.length === 0)) {
    return null;
  }

  if (!previousSets || previousSets.length === 0) {
    return <p className="text-xs text-ink-tertiary">First time, no history yet</p>;
  }

  const lines = previousSets.map((set) => formatLoggedSet(set, prescriptionType)).filter((line) => line.length > 0);

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
