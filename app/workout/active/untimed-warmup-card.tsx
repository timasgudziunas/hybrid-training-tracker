/** Warm-up slot with a timed prescription (hold or duration): owner decision
 * 2026-11-06, no timing is asked for. A single "mark complete" tap, same
 * look as QualitativeEntryCard. */
export default function UntimedWarmupCard({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-ink-tertiary">Warm-up, no timing needed</p>

      <button
        type="button"
        onClick={onComplete}
        className="h-16 rounded-xl bg-accent text-lg font-semibold text-accent-ink transition-colors active:bg-accent-strong"
      >
        Mark complete
      </button>
    </div>
  );
}
