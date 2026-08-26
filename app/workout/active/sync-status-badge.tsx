/** Small, non-blocking indicator: the workout keeps running on the
 * localStorage mirror regardless of Supabase sync state (CLAUDE.md
 * non-negotiable 22) — this just lets the athlete know a sync attempt has
 * failed, without ever interrupting the flow. */
export default function SyncStatusBadge({ synced }: { synced: boolean }) {
  if (synced) return null;

  return (
    <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-warning">
      <span className="h-1.5 w-1.5 rounded-full bg-warning" aria-hidden="true" />
      Not synced
    </span>
  );
}
