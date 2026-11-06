import type { TemplateSlot } from './flatten-template-slots';

export type SlotRow =
  | { kind: 'single'; slot: TemplateSlot }
  | { kind: 'superset'; token: string; slots: TemplateSlot[] };

/** Groups one section's slots into display rows: consecutive slots sharing a
 * supersetGroup token become one superset row; everything else is single. */
export function groupSupersetRows(slots: TemplateSlot[]): SlotRow[] {
  const rows: SlotRow[] = [];
  for (const slot of slots) {
    const token = slot.exercise.supersetGroup;
    const last = rows[rows.length - 1];
    if (!token) {
      rows.push({ kind: 'single', slot });
    } else if (last?.kind === 'superset' && last.token === token) {
      last.slots.push(slot);
    } else {
      rows.push({ kind: 'superset', token, slots: [slot] });
    }
  }
  return rows;
}
