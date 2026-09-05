import { clearLocalSession } from "@/lib/workout-session/local-session-store";
import { clearPendingSessions } from "@/lib/workout-session/pending-sync-store";

/**
 * Browser-local workout mirrors are not tied to an account. On a shared
 * device, a session another athlete left behind must never be resumed or
 * re-synced under the next sign-in, so both stores are cleared whenever the
 * signed-in account changes (sign-in, sign-up, sign-out).
 */
export function clearLocalAthleteData(): void {
  clearLocalSession();
  clearPendingSessions();
}
