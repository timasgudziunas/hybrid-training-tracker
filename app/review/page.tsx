import SiteHeader from "@/app/site-header";
import ReviewDashboard from "./review-dashboard";

/**
 * Weekly and monthly training review (R8, old Phase 10; PRODUCT_SPEC §16-17).
 * The window fetch is device-local-date-dependent, so it happens inside
 * ReviewDashboard (a client component) rather than here — this shell just
 * renders the shared header and page title.
 */
export default function ReviewPage() {
  return (
    <div className="flex flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <SiteHeader active="review" />

        <header className="flex flex-col gap-1.5">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-ink-tertiary">Review</p>
          <h1 className="font-display text-3xl font-bold text-ink-primary sm:text-4xl">Training Review</h1>
          <p className="text-sm text-ink-secondary">
            Weekly and monthly summaries from what you&rsquo;ve actually logged. Numbers, not scores.
          </p>
        </header>

        <ReviewDashboard />
      </div>
    </div>
  );
}
