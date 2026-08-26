import type { AdherenceResult } from "@/lib/history/adherence";

/** Adherence percent as a confident big-numeral stat (PRODUCT_SPEC §15:
 * "92% adherence"), never a streak. */
export default function AdherenceCard({
  adherence,
  hasProgram,
}: {
  adherence: AdherenceResult;
  hasProgram: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border border-line-hairline bg-surface-1 p-6 shadow-card sm:p-8">
      <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-ink-tertiary">
        Adherence, {adherence.windowLabel.toLowerCase()}
      </p>
      {adherence.percent !== null ? (
        <>
          <h2 className="font-display text-6xl font-bold tabular-nums text-ink-primary sm:text-7xl">
            {adherence.percent}%
          </h2>
          <p className="text-sm text-ink-secondary">
            {adherence.metDays} of {adherence.scheduledDays} scheduled training sessions completed.
          </p>
        </>
      ) : (
        <p className="text-sm text-ink-secondary">
          {hasProgram ? "No scheduled training days in this window yet." : "Paste a program to start tracking adherence."}
        </p>
      )}
    </div>
  );
}
