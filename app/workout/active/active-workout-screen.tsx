"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getLocalDateString } from "@/lib/date/local-date-string";
import { getLocalWeekday } from "@/lib/date/weekday-from-date";
import { getWorkoutForWeekday, exercisesForTemplate } from "@/lib/program/resolved-program";
import { SAMPLE_DEMO_WEEKDAY, SAMPLE_PROGRAM } from "@/lib/program/sample-program";
import { createNewSession } from "@/lib/workout-session/create-session";
import { computeCompletionStats } from "@/lib/workout-session/completion-stats";
import { flattenTemplateSlots, nextSlotKey, type TemplateSlot } from "@/lib/workout-session/flatten-template-slots";
import {
  clearLocalSession,
  loadLocalSession,
  saveLocalSession,
} from "@/lib/workout-session/local-session-store";
import { loadPendingSessions, removePendingSession, stashPendingSession } from "@/lib/workout-session/pending-sync-store";
import { isResumableSession, isSampleSession } from "@/lib/workout-session/resumable-session";
import { createSessionSaveQueue, type SessionSaveQueue } from "@/lib/workout-session/save-queue";
import type {
  ExerciseSlotLog,
  PreviousPerformanceByExercise,
  SetLog,
  WorkoutSessionRecord,
} from "@/lib/workout-session/workout-session-types";
import { fetchActiveProgram } from "@/app/program/actions";
import { fetchActiveSessionForToday, fetchPreviousPerformance, saveWorkoutSession } from "@/app/workout/actions";
import SessionTimer from "./session-timer";
import ExerciseTimer from "./exercise-timer";
import SyncStatusBadge from "./sync-status-badge";
import WorkoutOverview from "./workout-overview";
import ExerciseSlotView from "./exercise-slot-view";
import CompletionSummary, { type FinishState } from "./completion-summary";

const SAVE_DEBOUNCE_MS = 2500;

type Phase = "loading" | "rest-day" | "no-program" | "ready";

export default function ActiveWorkoutScreen({ source }: { source: "sample" | "program" }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [session, setSession] = useState<WorkoutSessionRecord | null>(null);
  // Only populated when phase becomes "rest-day" — since the 2026-08-25
  // pivot ANY weekday can be a rest day, not only Sunday, so the message
  // shown must come from the actual rest template, never a hardcoded name.
  const [restDayDescription, setRestDayDescription] = useState<string | null>(null);
  const [previousPerformance, setPreviousPerformance] = useState<PreviousPerformanceByExercise>({});
  const [synced, setSynced] = useState(true);
  const [overviewOpen, setOverviewOpen] = useState(false);
  // Replaces the old bare `finished` boolean (2026-08-26 save-queue rework)
  // so the completion screen can show saving/saved/failed distinctly and
  // offer a retry instead of silently claiming "Saved" on a failed save.
  const [finishState, setFinishState] = useState<FinishState>("idle");
  // When the current slot was entered, for the small per-exercise timer.
  // Deliberately not persisted — a refresh or an Overview jump restarting
  // the count is fine for a glance-only indicator.
  const [slotEnteredAtMs, setSlotEnteredAtMs] = useState<number | null>(null);

  const sessionRef = useRef<WorkoutSessionRecord | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // One save queue per mount, wrapping the saveWorkoutSession server action
  // so every save (debounced autosave, visibility flush, initial save,
  // Finish, retry) funnels through a single serialized pipe — the fix for
  // the 2026-08-26 incident where a stale pre-finish autosave landed AFTER
  // the finish save and silently reverted status back to 'active'. Every
  // completed save (success or failure) drives `synced`, exactly like the
  // old bare .then(setSynced) calls did. Lazily created into a ref (rather
  // than a plain useCallback wrapper) so it survives re-renders as one
  // instance without upsetting exhaustive-deps on every callback that uses
  // it — refs are exempt from that lint rule.
  const queueRef = useRef<SessionSaveQueue | null>(null);
  if (queueRef.current === null) {
    queueRef.current = createSessionSaveQueue(async (record) => {
      const result = await saveWorkoutSession(record);
      setSynced(result.ok);
      return { ok: result.ok };
    });
  }

  // The program is never re-resolved for an existing session — its
  // TrainingDayTemplate and referenced exercises were snapshotted into
  // performance.templateSnapshot/exercisesSnapshot at Start Workout, exactly
  // so a mid-week re-paste of the active program can never corrupt an
  // in-flight or historical session (2026-08-25 rework, program pivot).
  const template = session ? session.performance.templateSnapshot : null;
  const exercises = session ? session.performance.exercisesSnapshot : {};
  const templateSlots: TemplateSlot[] = useMemo(() => (template ? flattenTemplateSlots(template) : []), [template]);

  // Computed early (rather than after the phase early-returns below) so the
  // per-exercise timer effect, right after, has a plain value to depend on.
  // `null` in any phase before "ready".
  const currentSlotKey = session?.performance.currentSlotKey ?? null;

  // Resets the per-exercise timer whenever the athlete lands on a new
  // current slot (advance, skip, or an Overview jump). Reading/writing refs
  // and calling Date.now() are both disallowed during render by this
  // project's stricter React Compiler-era lint rules (react-hooks/refs,
  // react-hooks/purity), so this stays a real Effect; the setState call is
  // nested inside an inner function (matching the `init()` pattern above)
  // rather than sitting directly in the effect body, per this project's
  // react-hooks/set-state-in-effect rule.
  useEffect(() => {
    function markEntered() {
      if (currentSlotKey) setSlotEnteredAtMs(Date.now());
    }
    markEntered();
  }, [currentSlotKey]);

  const persist = useCallback((next: WorkoutSessionRecord) => {
    sessionRef.current = next;
    setSession(next);
    saveLocalSession(next);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      // Reads sessionRef.current at fire time, not a captured `next` — a
      // debounce closure capturing a stale snapshot is exactly what let a
      // pre-finish autosave overwrite the finish save (root cause of the
      // 2026-08-26 incident). The queue's own coalescing then guarantees
      // this can never persist out of order relative to a Finish/retry
      // request that lands first.
      if (sessionRef.current) queueRef.current!.request(sessionRef.current);
    }, SAVE_DEBOUNCE_MS);
  }, []);

  // Resume-or-start, once on mount. Prefers a local (this-device, this
  // browser) active session over a Supabase-fetched one, since local writes
  // are synchronous and therefore always at least as fresh; Supabase is the
  // fallback for a cleared localStorage or a different device, per
  // CLAUDE.md non-negotiable 22.
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const now = new Date();
      const local = loadLocalSession();
      // A completed session lingering locally means its final save never
      // landed (e.g. the workout_sessions table wasn't applied yet, or the
      // network dropped at Finish). Retry the sync through the queue before
      // anything can overwrite the mirror — awaited (init staying
      // "non-blocking in spirit" just means this is the one deliberate
      // exception), so we know before overwriting whether it's safe to drop
      // the local copy or whether it must be stashed first (see below).
      let localCompletedRetryFailed = false;
      if (local && local.status === "completed") {
        queueRef.current!.request(local);
        localCompletedRetryFailed = !(await queueRef.current!.settle());
      }
      // Resume the local session only when it's genuinely resumable: a
      // sample session never blocks starting the real program workout, and
      // an untouched leftover from a previous day is stale, not today's
      // workout. Anything with logged work always resumes (non-negotiable
      // 22) — including a real in-flight session when the athlete taps the
      // sample link. Discarding here (the local mirror's second clear site)
      // is safe precisely because the discarded record is a sample or has
      // nothing logged.
      let resolved: WorkoutSessionRecord | null = null;
      if (local && (local.status === "active" || local.status === "modified")) {
        if (!isResumableSession(local, getLocalDateString(now))) {
          clearLocalSession();
        } else if (source === "program" && isSampleSession(local)) {
          clearLocalSession();
        } else {
          resolved = local;
        }
      }

      if (!resolved) {
        const remote = await fetchActiveSessionForToday(getLocalDateString(now));
        if (remote.ok && remote.data && !(source === "program" && isSampleSession(remote.data))) {
          resolved = remote.data;
        }
      }

      if (!resolved) {
        // Starting brand new: resolve which program is in scope. The sample
        // is a static, already-parsed module — no server round trip needed.
        // Otherwise use whatever program is currently active; if none is,
        // there is nothing to start (mirrors the Today screen's waiting
        // state, for anyone who lands on this URL directly).
        const program =
          source === "sample"
            ? SAMPLE_PROGRAM
            : await (async () => {
                const activeResult = await fetchActiveProgram();
                return activeResult.ok ? activeResult.data?.parsed ?? null : null;
              })();

        if (!program) {
          if (!cancelled) setPhase("no-program");
          return;
        }

        // The sample always starts its showcase day so the demo never
        // dead-ends on one of the sample's rest days.
        const weekday = source === "sample" ? SAMPLE_DEMO_WEEKDAY : getLocalWeekday(now);
        const deviceTemplate = getWorkoutForWeekday(program, weekday);
        if (deviceTemplate.restDay) {
          if (!cancelled) {
            setRestDayDescription(deviceTemplate.description);
            setPhase("rest-day");
          }
          return;
        }
        const exercisesSnapshot = exercisesForTemplate(program, deviceTemplate);
        resolved = createNewSession(deviceTemplate, exercisesSnapshot, now);
        queueRef.current!.request(resolved);
      }

      // A completed session was lingering locally, its retry above failed,
      // and it's about to be overwritten by a different session below (it
      // always is here: a 'completed' record is never itself resumable, so
      // `resolved` can never BE `local` in this branch) — stash it via the
      // pending-sync store first so the finished workout is never lost,
      // even though the local mirror is about to move on.
      if (local && local.status === "completed" && localCompletedRetryFailed) {
        stashPendingSession(local);
      }

      saveLocalSession(resolved);
      sessionRef.current = resolved;
      if (cancelled) return;
      setSession(resolved);

      const prev = await fetchPreviousPerformance(resolved.workoutTemplateId, resolved.sessionDate);
      if (!cancelled && prev.ok) setPreviousPerformance(prev.data);

      // Fire-and-forget: retry any previously stashed finished-but-unsynced
      // sessions. These are different session ids than the one just
      // resolved above, so their upserts can never interleave with or be
      // reordered by the active session's own save queue.
      for (const pending of loadPendingSessions()) {
        saveWorkoutSession(pending).then((result) => {
          if (result.ok) removePendingSession(pending.id);
        });
      }

      if (!cancelled) setPhase("ready");
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [source]);

  // Best-effort immediate flush (in addition to the debounce) when the tab
  // is being hidden or closed — cheap insurance on top of the localStorage
  // mirror, which is already the non-negotiable guarantee.
  useEffect(() => {
    function flush() {
      if (sessionRef.current) {
        queueRef.current!.request(sessionRef.current);
      }
    }
    function onVisibilityChange() {
      if (document.visibilityState === "hidden") flush();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", flush);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const updateSlot = useCallback(
    (slotKey: string, updater: (slot: ExerciseSlotLog) => ExerciseSlotLog) => {
      const prev = sessionRef.current;
      if (!prev) return;
      const nextSlots = { ...prev.performance.slots, [slotKey]: updater(prev.performance.slots[slotKey]) };
      persist({ ...prev, performance: { ...prev.performance, slots: nextSlots } });
    },
    [persist]
  );

  const advanceFrom = useCallback(
    (slotKey: string, status: "completed" | "skipped") => {
      const prev = sessionRef.current;
      if (!prev) return;
      const updatedSlot: ExerciseSlotLog = { ...prev.performance.slots[slotKey], status };
      const next = nextSlotKey(templateSlots, slotKey);
      persist({
        ...prev,
        performance: {
          ...prev.performance,
          slots: { ...prev.performance.slots, [slotKey]: updatedSlot },
          currentSlotKey: next,
        },
      });
    },
    [persist, templateSlots]
  );

  const handleChoose = useCallback(
    (slotKey: string, exerciseId: string) => updateSlot(slotKey, (slot) => ({ ...slot, chosenExerciseId: exerciseId })),
    [updateSlot]
  );

  const handleLogSet = useCallback(
    (slotKey: string, set: SetLog) =>
      updateSlot(slotKey, (slot) => {
        const sets = [...slot.sets];
        // A set number beyond the currently committed count is the new
        // "current" set being entered — committing it clears the draft, so
        // the next fresh set starts blank. A set number within the
        // existing range is a correction to an earlier set (edit-a-set):
        // the draft for whatever set is currently being entered must
        // survive that untouched.
        const isNewCurrentSet = set.setNumber > slot.sets.length;
        sets[set.setNumber - 1] = set;
        return { ...slot, sets, draft: isNewCurrentSet ? undefined : slot.draft };
      }),
    [updateSlot]
  );

  const handleDraftChange = useCallback(
    (slotKey: string, draft: ExerciseSlotLog["draft"]) => updateSlot(slotKey, (slot) => ({ ...slot, draft })),
    [updateSlot]
  );

  const handleRemoveLastSet = useCallback(
    (slotKey: string) =>
      updateSlot(slotKey, (slot) => ({
        ...slot,
        sets: slot.sets.slice(0, -1),
        extraSets: slot.extraSets && slot.extraSets > 0 ? slot.extraSets - 1 : slot.extraSets,
      })),
    [updateSlot]
  );

  const handleAddExtraSet = useCallback(
    (slotKey: string) => updateSlot(slotKey, (slot) => ({ ...slot, extraSets: (slot.extraSets ?? 0) + 1 })),
    [updateSlot]
  );

  const handleSetNote = useCallback(
    (slotKey: string, note: string) => updateSlot(slotKey, (slot) => ({ ...slot, note })),
    [updateSlot]
  );

  const handleQualitativeComplete = useCallback(
    (slotKey: string) => {
      const prev = sessionRef.current;
      if (!prev) return;
      const updatedSlot: ExerciseSlotLog = {
        ...prev.performance.slots[slotKey],
        qualitativeCompleted: true,
        status: "completed",
      };
      const next = nextSlotKey(templateSlots, slotKey);
      persist({
        ...prev,
        performance: {
          ...prev.performance,
          slots: { ...prev.performance.slots, [slotKey]: updatedSlot },
          currentSlotKey: next,
        },
      });
    },
    [persist, templateSlots]
  );

  const handleJump = useCallback(
    (slotKey: string) => {
      const prev = sessionRef.current;
      if (!prev) return;
      persist({ ...prev, performance: { ...prev.performance, currentSlotKey: slotKey } });
      setOverviewOpen(false);
    },
    [persist]
  );

  const handleSetDifficulty = useCallback(
    (value: number | undefined) => {
      const prev = sessionRef.current;
      if (!prev) return;
      persist({ ...prev, performance: { ...prev.performance, sessionDifficulty: value } });
    },
    [persist]
  );

  const handleSetSessionNote = useCallback(
    (value: string) => {
      const prev = sessionRef.current;
      if (!prev) return;
      persist({ ...prev, performance: { ...prev.performance, sessionNote: value } });
    },
    [persist]
  );

  const handleFinish = useCallback(async () => {
    const prev = sessionRef.current;
    if (!prev) return;

    // Cancel any pending debounced autosave FIRST. Without this, the
    // debounce timer scheduled by the athlete's last mutation before
    // Finish could still fire after the final save below, requesting a
    // stale pre-finish record into the queue — exactly the bug this
    // save-queue rework fixes. Reading sessionRef.current at fire time
    // (see `persist`) closes the other half of the original hole, but
    // there is no reason to let that stale request happen at all when
    // Finish is already in flight.
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    const nowIso = new Date().toISOString();
    const durationSeconds = Math.round((new Date(nowIso).getTime() - new Date(prev.startedAt).getTime()) / 1000);
    const stats = computeCompletionStats(prev.performance, templateSlots);

    const finalRecord: WorkoutSessionRecord = {
      ...prev,
      status: "completed",
      completedAt: nowIso,
      durationSeconds,
      sessionDifficulty: prev.performance.sessionDifficulty ?? null,
      notes: prev.performance.sessionNote ?? null,
      performance: { ...prev.performance, stats },
    };

    sessionRef.current = finalRecord;
    setSession(finalRecord);
    saveLocalSession(finalRecord);
    setFinishState("saving");

    queueRef.current!.request(finalRecord);
    const ok = await queueRef.current!.settle();

    // Only drop the local mirror once the server actually has the session.
    // If the save failed (table not applied yet, network drop), the local
    // copy is the ONLY record of this workout — keep it; Retry save (or the
    // pending-sync stash, the next time a session starts) covers the rest.
    if (ok) {
      clearLocalSession();
    }
    setFinishState(ok ? "saved" : "failed");
  }, [templateSlots]);

  const handleRetryFinish = useCallback(async () => {
    const record = sessionRef.current;
    if (!record) return;
    setFinishState("saving");
    queueRef.current!.request(record);
    const ok = await queueRef.current!.settle();
    if (ok) clearLocalSession();
    setFinishState(ok ? "saved" : "failed");
  }, []);

  if (phase === "loading") {
    return <div className="h-64 w-full animate-pulse rounded-2xl bg-surface-1" aria-hidden="true" />;
  }

  if (phase === "rest-day") {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-line-hairline bg-surface-1 p-6 shadow-card">
        <p className="text-sm text-ink-secondary">
          There is nothing to start today. {restDayDescription ?? "Rest or easy movement only."}
        </p>
        <Link href="/" className="text-sm font-medium text-accent-strong underline underline-offset-4">
          Back to Today
        </Link>
      </div>
    );
  }

  if (phase === "no-program") {
    return (
      <div className="flex flex-col gap-5 rounded-2xl border border-line-hairline bg-surface-1 p-6 shadow-card">
        <p className="text-sm text-ink-secondary">No program is loaded yet.</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/program"
            className="flex h-12 flex-1 items-center justify-center rounded-xl bg-accent text-sm font-semibold text-accent-ink transition-colors active:bg-accent-strong"
          >
            Paste your program
          </Link>
          <Link
            href="/workout/active?source=sample"
            className="flex h-12 flex-1 items-center justify-center rounded-xl border border-line-default text-sm font-medium text-ink-secondary transition-colors active:bg-surface-2"
          >
            Try the sample workout
          </Link>
        </div>
      </div>
    );
  }

  if (!session || !template) {
    return null;
  }

  const currentTemplateSlot = currentSlotKey ? templateSlots.find((s) => s.slotKey === currentSlotKey) ?? null : null;
  const currentSlotLog = currentSlotKey ? session.performance.slots[currentSlotKey] : null;

  const liveStats = computeCompletionStats(session.performance, templateSlots);

  const viewKey = overviewOpen
    ? "overview"
    : currentSlotKey
      ? `${currentSlotKey}:${currentSlotLog?.chosenExerciseId ?? "choice"}:${currentSlotLog?.sets.length ?? 0}`
      : "completion";

  return (
    <div className="flex flex-col gap-5">
      <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between border-b border-line-hairline bg-surface-0/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-3">
          <SessionTimer startedAt={session.startedAt} />
          {currentSlotKey && !overviewOpen && slotEnteredAtMs !== null ? (
            <>
              <span className="text-ink-tertiary" aria-hidden="true">
                &middot;
              </span>
              <ExerciseTimer sinceMs={slotEnteredAtMs} />
            </>
          ) : null}
          <SyncStatusBadge synced={synced} />
        </div>
        {currentSlotKey ? (
          <button
            type="button"
            onClick={() => setOverviewOpen((prev) => !prev)}
            className="rounded-lg px-2 py-1 text-sm font-medium text-ink-secondary transition-colors active:bg-surface-2 active:text-ink-primary"
          >
            {overviewOpen ? "Close" : "Overview"}
          </button>
        ) : null}
      </div>

      <div key={viewKey} className="workout-slide-in">
        {overviewOpen ? (
          <WorkoutOverview
            templateSlots={templateSlots}
            slotLogs={session.performance.slots}
            currentSlotKey={currentSlotKey}
            exercises={exercises}
            onJump={handleJump}
            onClose={() => setOverviewOpen(false)}
          />
        ) : currentTemplateSlot && currentSlotLog ? (
          <ExerciseSlotView
            templateSlot={currentTemplateSlot}
            slotLog={currentSlotLog}
            previousPerformance={previousPerformance}
            exercises={exercises}
            onChoose={(exerciseId) => handleChoose(currentTemplateSlot.slotKey, exerciseId)}
            onLogSet={(set) => handleLogSet(currentTemplateSlot.slotKey, set)}
            onRemoveLastSet={() => handleRemoveLastSet(currentTemplateSlot.slotKey)}
            onAddExtraSet={() => handleAddExtraSet(currentTemplateSlot.slotKey)}
            onAdvance={() => advanceFrom(currentTemplateSlot.slotKey, "completed")}
            onSkip={() => advanceFrom(currentTemplateSlot.slotKey, "skipped")}
            onSetNote={(note) => handleSetNote(currentTemplateSlot.slotKey, note)}
            onQualitativeComplete={() => handleQualitativeComplete(currentTemplateSlot.slotKey)}
            onDraftChange={(draft) => handleDraftChange(currentTemplateSlot.slotKey, draft)}
          />
        ) : (
          <CompletionSummary
            startedAt={session.startedAt}
            finalDurationSeconds={session.durationSeconds}
            stats={liveStats}
            difficulty={session.performance.sessionDifficulty}
            note={session.performance.sessionNote ?? ""}
            onSetDifficulty={handleSetDifficulty}
            onSetNote={handleSetSessionNote}
            onFinish={handleFinish}
            finishState={finishState}
            onRetry={handleRetryFinish}
          />
        )}
      </div>

      {finishState !== "idle" ? (
        <Link href="/" className="text-center text-sm font-medium text-accent-strong underline underline-offset-4">
          Back to Today
        </Link>
      ) : null}
    </div>
  );
}
