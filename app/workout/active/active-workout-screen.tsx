"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getLocalDateString } from "@/lib/date/local-date-string";
import { getLocalWeekday } from "@/lib/date/weekday-from-date";
import { getWorkoutForWeekday } from "@/lib/program/weekly-program";
import { createNewSession } from "@/lib/workout-session/create-session";
import { computeCompletionStats } from "@/lib/workout-session/completion-stats";
import { flattenTemplateSlots, nextSlotKey, type TemplateSlot } from "@/lib/workout-session/flatten-template-slots";
import {
  clearLocalSession,
  loadLocalSession,
  saveLocalSession,
} from "@/lib/workout-session/local-session-store";
import type {
  ExerciseSlotLog,
  PreviousPerformanceByExercise,
  SetLog,
  WorkoutSessionRecord,
} from "@/lib/workout-session/workout-session-types";
import { fetchActiveSessionForToday, fetchPreviousPerformance, saveWorkoutSession } from "@/app/workout/actions";
import SessionTimer from "./session-timer";
import SyncStatusBadge from "./sync-status-badge";
import WorkoutOverview from "./workout-overview";
import ExerciseSlotView from "./exercise-slot-view";
import CompletionSummary from "./completion-summary";

const SAVE_DEBOUNCE_MS = 2500;

type Phase = "loading" | "rest-day" | "ready";

export default function ActiveWorkoutScreen() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [session, setSession] = useState<WorkoutSessionRecord | null>(null);
  const [previousPerformance, setPreviousPerformance] = useState<PreviousPerformanceByExercise>({});
  const [synced, setSynced] = useState(true);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [finished, setFinished] = useState(false);

  const sessionRef = useRef<WorkoutSessionRecord | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const template = session ? getWorkoutForWeekday(session.weekday) : null;
  const templateSlots: TemplateSlot[] = useMemo(
    () => (template && !template.restDay ? flattenTemplateSlots(template) : []),
    [template]
  );

  const persist = useCallback((next: WorkoutSessionRecord) => {
    sessionRef.current = next;
    setSession(next);
    saveLocalSession(next);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveWorkoutSession(next).then((result) => setSynced(result.ok));
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
      // network dropped at Finish). Retry the sync before anything can
      // overwrite the mirror — best effort, never blocks starting today.
      if (local && local.status === "completed") {
        saveWorkoutSession(local);
      }
      let resolved: WorkoutSessionRecord | null =
        local && (local.status === "active" || local.status === "modified") ? local : null;

      if (!resolved) {
        const remote = await fetchActiveSessionForToday(getLocalDateString(now));
        if (remote.ok && remote.data) {
          resolved = remote.data;
        }
      }

      if (!resolved) {
        const deviceTemplate = getWorkoutForWeekday(getLocalWeekday(now));
        if (deviceTemplate.restDay) {
          if (!cancelled) setPhase("rest-day");
          return;
        }
        resolved = createNewSession(deviceTemplate, now);
        saveWorkoutSession(resolved).then((result) => {
          if (!cancelled) setSynced(result.ok);
        });
      }

      saveLocalSession(resolved);
      sessionRef.current = resolved;
      if (cancelled) return;
      setSession(resolved);

      const resolvedTemplate = getWorkoutForWeekday(resolved.weekday);
      if (!resolvedTemplate.restDay) {
        const prev = await fetchPreviousPerformance(resolvedTemplate.id, resolved.sessionDate);
        if (!cancelled && prev.ok) setPreviousPerformance(prev.data);
      }

      if (!cancelled) setPhase("ready");
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  // Best-effort immediate flush (in addition to the debounce) when the tab
  // is being hidden or closed — cheap insurance on top of the localStorage
  // mirror, which is already the non-negotiable guarantee.
  useEffect(() => {
    function flush() {
      if (sessionRef.current) {
        saveWorkoutSession(sessionRef.current);
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
        sets[set.setNumber - 1] = set;
        return { ...slot, sets };
      }),
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
    const result = await saveWorkoutSession(finalRecord);
    setSynced(result.ok);
    // Only drop the local mirror once the server actually has the session.
    // If the save failed (table not applied yet, network drop), the local
    // copy is the ONLY record of this workout — keep it; the next visit
    // retries the sync. A completed record never renders as "Resume".
    if (result.ok) {
      clearLocalSession();
    }
    setFinished(true);
  }, [templateSlots]);

  if (phase === "loading") {
    return <div className="h-64 w-full animate-pulse rounded-lg bg-zinc-950" aria-hidden="true" />;
  }

  if (phase === "rest-day") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-zinc-400">Sunday is a complete rest day. There is nothing to start.</p>
        <Link href="/" className="text-sm text-white underline underline-offset-4">
          Back to Today
        </Link>
      </div>
    );
  }

  if (!session || !template || template.restDay) {
    return null;
  }

  const currentSlotKey = session.performance.currentSlotKey;
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SessionTimer startedAt={session.startedAt} />
          <SyncStatusBadge synced={synced} />
        </div>
        {currentSlotKey ? (
          <button
            type="button"
            onClick={() => setOverviewOpen((prev) => !prev)}
            className="text-sm text-zinc-400 active:text-white"
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
            onJump={handleJump}
            onClose={() => setOverviewOpen(false)}
          />
        ) : currentTemplateSlot && currentSlotLog ? (
          <ExerciseSlotView
            templateSlot={currentTemplateSlot}
            slotLog={currentSlotLog}
            previousPerformance={previousPerformance}
            onChoose={(exerciseId) => handleChoose(currentTemplateSlot.slotKey, exerciseId)}
            onLogSet={(set) => handleLogSet(currentTemplateSlot.slotKey, set)}
            onRemoveLastSet={() => handleRemoveLastSet(currentTemplateSlot.slotKey)}
            onAddExtraSet={() => handleAddExtraSet(currentTemplateSlot.slotKey)}
            onAdvance={() => advanceFrom(currentTemplateSlot.slotKey, "completed")}
            onSkip={() => advanceFrom(currentTemplateSlot.slotKey, "skipped")}
            onSetNote={(note) => handleSetNote(currentTemplateSlot.slotKey, note)}
            onQualitativeComplete={() => handleQualitativeComplete(currentTemplateSlot.slotKey)}
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
            finished={finished}
          />
        )}
      </div>

      {finished ? (
        <Link href="/" className="text-center text-sm text-zinc-400 underline underline-offset-4">
          Back to Today
        </Link>
      ) : null}
    </div>
  );
}
