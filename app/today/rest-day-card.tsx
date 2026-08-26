import type { RestDayTemplate } from "@/lib/program/program-types";

/** Sunday always renders REST DAY (CLAUDE.md non-negotiables 11, 20) — never
 * a manufactured workout. RestDayTemplate has no sections field at all, so
 * there is structurally nothing to render but its name + description. */
export default function RestDayCard({ template }: { template: RestDayTemplate }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line-hairline bg-surface-1 p-6 shadow-card sm:p-8">
      <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-ink-tertiary">Rest day</p>
      <h1 className="font-display text-3xl font-bold text-ink-primary sm:text-4xl">{template.name}</h1>
      <p className="text-sm text-ink-secondary">{template.description}</p>
    </div>
  );
}
