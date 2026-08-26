import type { RestDayTemplate } from "@/lib/program/program-types";

/** Sunday always renders REST DAY (CLAUDE.md non-negotiables 11, 20) — never
 * a manufactured workout. RestDayTemplate has no sections field at all, so
 * there is structurally nothing to render but its name + description. */
export default function RestDayCard({ template }: { template: RestDayTemplate }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Rest Day</p>
      <h1 className="text-xl font-semibold text-white">{template.name}</h1>
      <p className="text-sm text-zinc-400">{template.description}</p>
    </div>
  );
}
