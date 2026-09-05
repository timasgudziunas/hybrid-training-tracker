"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getLocalDateString } from "@/lib/date/local-date-string";
import { getLocalWeekday } from "@/lib/date/weekday-from-date";
import type { Prescription, TrainingDayTemplate, Exercise } from "@/lib/program/program-types";
import { getWorkoutForWeekday, exercisesForTemplate } from "@/lib/program/resolved-program";
import { SAMPLE_DEMO_WEEKDAY, SAMPLE_PROGRAM } from "@/lib/program/sample-program";
import { closeUnfinishedSession } from "@/lib/workout-session/close-unfinished-session";
import { createNewSession } from "@/lib/workout-session/create-session";
import { computeCompletionStats } from "@/lib/workout-session/completion-stats";
import { flattenTemplateSlots, nextUnfinishedSlotKey, type TemplateSlot } from "@/lib/workout-session/flatten-template-slots";
import {
  clearLocalSession,
  loadLocalSession,
  saveLocalSession,
} from "@/lib/workout-session/local-session-store";
import { loadPendingSessions, removePendingSession, stashPendingSession } from "@/lib/workout-session/pending-sync-store";
import { isResumableSession, isSampleSession, isStaleUnfinishedSession } from "@/lib/workout-session/resumable-session";
import { detectSessionDeviations, resolveFinishStatus } from "@/lib/workout-session/session-deviations";
import { createSessionSaveQueue, type SessionSaveQueue } from "@/lib/workout-session/save-queue";
import { isCardioSlot } from "@/lib/workout-session/cardio-slot";
import { addExtraSet, deleteLoggedSet, removeCurrentSet, targetSetCount } from "@/lib/workout-session/slot-set-edits";
import { addExerciseToSession } from "@/lib/workout-session/add-exercise";
import { prescriptionForSwap, swapChangesPrescription } from "@/lib/workout-session/swap-prescription";
import type {
  EndedEarlyReason,
  ExerciseSlotLog,
  PreviousPerformanceByExercise,
  SetLog,
  SlotSubstitution,
  WorkoutSessionRecord,
} from "@/lib/workout-session/workout-session-types";
import { DEFAULT_ATHLETE_SETTINGS, type AthleteSettings } from "@/lib/settings/athlete-settings";
import { fetchAthleteSettings } from "@/app/settings/actions";
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

/** Rewrites one slot's prescription inside the session's own templateSnapshot
 * (R10, "presets feed Swap"). Slot keys are section id + order
 * (flatten-template-slots.ts's slotKeyFor), so the write is addressed the
 * same way rather than by parsing the key string. Pure; used by both
 * handleSwap (adopting a substitute's own prescription) and
 * handleRevertSwap (restoring what SlotSubstitution.originalPrescription
 * recorded). */
function withUpdatedPrescription(
  template: TrainingDayTemplate,
  sectionId: string,
  order: number,
  prescription: Prescription
): TrainingDayTemplate {
  return {
    ...template,
    sections: template.sections.map((section) =>
      section.id !== sectionId
        ? section
        : {
            ...section,
            exercises: section.exercises.map((entry) => (entry.order !== order ? entry : { ...entry, prescription })),
          }
    ),
  };
}

export default function ActiveWorkoutScreen({ source }: { source: "sample" | "program" }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [session, setSession] = useState<WorkoutSessionRecord | null>(null);
  // Only populated when phase becomes "rest-day" — since the 2026-08-25
  // pivot ANY weekday can be a rest day, not only Sunday, so the message
  // shown must come from the actual rest template, never a hardcoded name.
  const [restDayDescription, setRestDayDescription] = useState<string | null>(null);
  const [previousPerformance, setPreviousPerformance] = useState<PreviousPerformanceByExercise>({});
  // Athlete-level app settings (R10: RIR display toggle). Fetched once in
  // init, in parallel with everything else there, and never blocks the
  // workout on failure — a missing table or a read error just means the
  // defaults (see fetchAthleteSettings's own degrade-gracefully contract).
  const [athleteSettings, setAthleteSettings] = useState<AthleteSettings>(DEFAULT_ATHLETE_SETTINGS);
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
      const today = getLocalDateString(now);
      // Fired here, awaited only much later (right before "ready") — runs
      // in parallel with the program/session resolution below rather than
      // blocking it, and a failure just means the defaults win.
      const settingsPromise = fetchAthleteSettings();
      const local = loadLocalSession();
      // A completed OR modified session lingering locally means its final
      // save never landed (e.g. the workout_sessions table wasn't applied
      // yet, or the network dropped at Finish). Both are terminal,
      // finished-but-possibly-unsynced statuses since the Phase 5 rework
      // (modified is assigned deterministically at Finish, same code path as
      // completed) — retry the sync through the queue before anything can
      // overwrite the mirror, awaited (init staying "non-blocking in spirit"
      // just means this is the one deliberate exception), so we know before
      // overwriting whether it's safe to drop the local copy or whether it
      // must be stashed first (see below).
      let localFinishedRetryFailed = false;
      if (local && (local.status === "completed" || local.status === "modified")) {
        queueRef.current!.request(local);
        localFinishedRetryFailed = !(await queueRef.current!.settle());
      }

      // A stale unfinished session (active, has logged work, but started too
      // long ago to still be "tonight's" workout — resumable-session.ts)
      // must never hijack a later day's Today screen (owner: "I don't want
      // tomorrow's session to change because I didn't finish exercises from
      // the session before"). Close it as Modified via closeUnfinishedSession
      // and retry the sync through the queue, same shape as the
      // completed/modified branch above: await the settle so we know before
      // this session moves on to today's workout whether it's safe to drop
      // the closed copy or whether it must be stashed first (see below).
      let localStaleCloseFailed = false;
      let closedStaleLocal: WorkoutSessionRecord | null = null;
      if (
        local &&
        local.status === "active" &&
        !isSampleSession(local) &&
        isStaleUnfinishedSession(local, today, now.getTime())
      ) {
        closedStaleLocal = closeUnfinishedSession(local, flattenTemplateSlots(local.performance.templateSnapshot));
        queueRef.current!.request(closedStaleLocal);
        localStaleCloseFailed = !(await queueRef.current!.settle());
      }

      // Resume the local session only when it's genuinely resumable: a
      // sample session never blocks starting the real program workout, an
      // untouched leftover from a previous day is stale, not today's
      // workout, and a stale unfinished session (just closed above) is never
      // resumed either — isResumableSession already returns false for it, so
      // this falls into the same clearLocalSession() branch. Anything with
      // logged work AND started recently enough always resumes (non-
      // negotiable 22) — including a real in-flight session when the athlete
      // taps the sample link. Discarding here (the local mirror's second
      // clear site) is safe precisely because the discarded record is a
      // sample, has nothing logged, or was already synced above.
      let resolved: WorkoutSessionRecord | null = null;
      if (local && local.status === "active") {
        if (!isResumableSession(local, today, now.getTime())) {
          clearLocalSession();
        } else if (source === "program" && isSampleSession(local)) {
          clearLocalSession();
        } else {
          resolved = local;
        }
      }

      if (!resolved) {
        const remote = await fetchActiveSessionForToday(today);
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

      // A completed or modified session was lingering locally, its retry
      // above failed, and it's about to be overwritten by a different
      // session below (it always is here: neither status is itself
      // resumable, so `resolved` can never BE `local` in this branch) —
      // stash it via the pending-sync store first so the finished workout is
      // never lost, even though the local mirror is about to move on.
      if (local && (local.status === "completed" || local.status === "modified") && localFinishedRetryFailed) {
        stashPendingSession(local);
      }

      // Same guarantee for a stale unfinished session that was just closed
      // above: its sync retry failed, so stash the CLOSED (Modified) record
      // — never the raw local one — so it is never lost even though the
      // local mirror is about to move on to today's session.
      if (closedStaleLocal && localStaleCloseFailed) {
        stashPendingSession(closedStaleLocal);
      }

      saveLocalSession(resolved);
      sessionRef.current = resolved;
      if (cancelled) return;
      setSession(resolved);

      const prev = await fetchPreviousPerformance(Object.keys(resolved.performance.exercisesSnapshot), resolved.sessionDate);
      if (!cancelled && prev.ok) setPreviousPerformance(prev.data);

      const settingsResult = await settingsPromise;
      if (!cancelled) setAthleteSettings(settingsResult.ok ? settingsResult.data : DEFAULT_ATHLETE_SETTINGS);

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
      // Skip past anything already finished (owner: "if I finish an
      // exercise that isn't next up and click next, it should skip the one
      // I already finished"); once nothing remains AHEAD, land on the
      // overview instead of the completion screen so the athlete sees
      // what's left rather than being funneled straight to Finish (owner:
      // "after the last exercise it should go to the overview").
      const { next, remainingElsewhere } = nextUnfinishedSlotKey(templateSlots, prev.performance.slots, slotKey);
      const nextCurrentSlotKey = next ?? remainingElsewhere[0] ?? null;
      persist({
        ...prev,
        performance: {
          ...prev.performance,
          slots: { ...prev.performance.slots, [slotKey]: updatedSlot },
          currentSlotKey: nextCurrentSlotKey,
        },
      });
      if (!next && remainingElsewhere.length > 0) setOverviewOpen(true);
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
        const nextSlot: ExerciseSlotLog = { ...slot, sets, draft: isNewCurrentSet ? undefined : slot.draft };
        // R10: logging the final target set no longer advances (owner:
        // "I want to see the exercise overview and then click Next
        // exercise"), so completion is recorded HERE, the moment the last
        // set lands. Otherwise an exercise with every set logged would still
        // read as upcoming in the progress bar and, if the athlete jumped
        // elsewhere without tapping Next exercise, as "Not done" at Finish.
        // The advance button afterwards is navigation only.
        const prescription = templateSlots.find((s) => s.slotKey === slotKey)?.exercise.prescription;
        if (
          prescription &&
          prescription.type !== "qualitative" &&
          nextSlot.status === "upcoming" &&
          sets.length >= targetSetCount(prescription.sets, nextSlot)
        ) {
          nextSlot.status = "completed";
        }
        return nextSlot;
      }),
    [updateSlot, templateSlots]
  );

  const handleDraftChange = useCallback(
    (slotKey: string, draft: ExerciseSlotLog["draft"]) => updateSlot(slotKey, (slot) => ({ ...slot, draft })),
    [updateSlot]
  );

  const handleRemoveCurrentSet = useCallback(
    (slotKey: string) => updateSlot(slotKey, removeCurrentSet),
    [updateSlot]
  );

  const handleDeleteSet = useCallback(
    (slotKey: string, setNumber: number) => updateSlot(slotKey, (slot) => deleteLoggedSet(slot, setNumber)),
    [updateSlot]
  );

  const handleAddExtraSet = useCallback(
    (slotKey: string) => updateSlot(slotKey, addExtraSet),
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
      const { next, remainingElsewhere } = nextUnfinishedSlotKey(templateSlots, prev.performance.slots, slotKey);
      const nextCurrentSlotKey = next ?? remainingElsewhere[0] ?? null;
      persist({
        ...prev,
        performance: {
          ...prev.performance,
          slots: { ...prev.performance.slots, [slotKey]: updatedSlot },
          currentSlotKey: nextCurrentSlotKey,
        },
      });
      if (!next && remainingElsewhere.length > 0) setOverviewOpen(true);
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

  // --- Phase 5 modify-don't-fail actions. Every handler mirrors updateSlot/
  // persist's read-sessionRef-current-then-persist shape (landmine 4: never
  // capture a stale record in a closure, always go through the mount's save
  // queue via persist). Deviations shown at completion are DERIVED from
  // these plus the slot logs (session-deviations.ts) — never stored
  // themselves.

  const handleToggleReducedLoad = useCallback(
    (slotKey: string) => {
      const prev = sessionRef.current;
      if (!prev) return;
      const current = prev.performance.modifications?.reducedLoadSlotKeys ?? [];
      const next = current.includes(slotKey) ? current.filter((key) => key !== slotKey) : [...current, slotKey];
      persist({
        ...prev,
        performance: {
          ...prev.performance,
          modifications: { ...prev.performance.modifications, reducedLoadSlotKeys: next },
        },
      });
    },
    [persist]
  );

  const handleSwap = useCallback(
    (slotKey: string, exercise: Exercise) => {
      const prev = sessionRef.current;
      if (!prev) return;
      const slot = prev.performance.slots[slotKey];
      if (!slot) return;
      const templateSlot = templateSlots.find((s) => s.slotKey === slotKey);
      const existingSubs = prev.performance.modifications?.substitutions ?? [];
      const existingSub = existingSubs.find((sub) => sub.slotKey === slotKey);

      let templateSnapshot = prev.performance.templateSnapshot;
      let nextSubs: SlotSubstitution[];

      if (exercise.id === slot.prescribedExerciseId) {
        // Picking the slot's own prescribed exercise from the picker (it
        // reappears in the list once a substitution is active) is a
        // revert, never a "Substituted X for X" record — restore whatever
        // prescription the earlier swap changed, same as "Back to X".
        if (existingSub?.originalPrescription && templateSlot) {
          templateSnapshot = withUpdatedPrescription(
            templateSnapshot,
            templateSlot.section.id,
            templateSlot.exercise.order,
            existingSub.originalPrescription
          );
        }
        nextSubs = existingSubs.filter((sub) => sub.slotKey !== slotKey);
      } else {
        // R10 "presets feed Swap": a substitute that logs a different kind
        // of set than the slot it replaces adopts its own defaultPrescription
        // (lib/workout-session/swap-prescription.ts), and the ORIGINAL
        // (program) prescription is kept on the substitution so a revert can
        // restore it. If a substitution already exists (swapping again
        // without reverting first), its recorded originalPrescription is
        // the true program original — the slot's CURRENT prescription at
        // this point may already be an earlier swap's adopted preset, which
        // must never be mistaken for "the original" or a second swap back
        // to a same-type exercise would strand the wrong prescription.
        const trueOriginalPrescription = existingSub?.originalPrescription ?? templateSlot?.exercise.prescription;
        const changesPrescription =
          trueOriginalPrescription !== undefined && swapChangesPrescription(trueOriginalPrescription, exercise);

        if (trueOriginalPrescription !== undefined && templateSlot) {
          const finalPrescription = prescriptionForSwap(trueOriginalPrescription, exercise);
          templateSnapshot = withUpdatedPrescription(
            templateSnapshot,
            templateSlot.section.id,
            templateSlot.exercise.order,
            finalPrescription
          );
        }

        nextSubs = [
          ...existingSubs.filter((sub) => sub.slotKey !== slotKey),
          {
            slotKey,
            fromExerciseId: slot.prescribedExerciseId,
            toExerciseId: exercise.id,
            ...(changesPrescription && trueOriginalPrescription !== undefined ? { originalPrescription: trueOriginalPrescription } : {}),
          },
        ];
      }

      persist({
        ...prev,
        performance: {
          ...prev.performance,
          templateSnapshot,
          slots: { ...prev.performance.slots, [slotKey]: { ...slot, chosenExerciseId: exercise.id } },
          exercisesSnapshot: { ...prev.performance.exercisesSnapshot, [exercise.id]: exercise },
          modifications: { ...prev.performance.modifications, substitutions: nextSubs },
        },
      });

      // A swapped-in exercise the athlete has never logged before this
      // session has no entry in `previousPerformance` yet (it was only ever
      // fetched for the ORIGINAL template's exercises at Start Workout) —
      // fetch its own prior exposure now so "Previous" still shows up after
      // a swap, same as PRODUCT_SPEC §7 promises for every other exercise.
      // Fire-and-forget: the entry card renders fine with no previous data
      // in the meantime.
      if (previousPerformance[exercise.id] === undefined) {
        fetchPreviousPerformance([exercise.id], prev.sessionDate).then((result) => {
          if (result.ok) {
            setPreviousPerformance((current) => ({ ...current, ...result.data }));
          }
        });
      }
    },
    [persist, previousPerformance, templateSlots]
  );

  const handleRevertSwap = useCallback(
    (slotKey: string) => {
      const prev = sessionRef.current;
      if (!prev) return;
      const slot = prev.performance.slots[slotKey];
      if (!slot) return;
      const templateSlot = templateSlots.find((s) => s.slotKey === slotKey);
      const isChoiceSlot = Boolean(templateSlot?.exercise.alternativeExerciseIds?.length);
      const substitution = (prev.performance.modifications?.substitutions ?? []).find((sub) => sub.slotKey === slotKey);
      const nextSubs = (prev.performance.modifications?.substitutions ?? []).filter((sub) => sub.slotKey !== slotKey);

      const templateSnapshot =
        substitution?.originalPrescription && templateSlot
          ? withUpdatedPrescription(
              prev.performance.templateSnapshot,
              templateSlot.section.id,
              templateSlot.exercise.order,
              substitution.originalPrescription
            )
          : prev.performance.templateSnapshot;

      persist({
        ...prev,
        performance: {
          ...prev.performance,
          templateSnapshot,
          slots: {
            ...prev.performance.slots,
            [slotKey]: { ...slot, chosenExerciseId: isChoiceSlot ? undefined : slot.prescribedExerciseId },
          },
          modifications: { ...prev.performance.modifications, substitutions: nextSubs },
        },
      });
    },
    [persist, templateSlots]
  );

  const handleAddExercise = useCallback(
    (exercise: Exercise) => {
      const prev = sessionRef.current;
      if (!prev) return;
      const { record } = addExerciseToSession(prev, exercise);
      persist(record);
      setOverviewOpen(false);

      // Same rationale as handleSwap: a freshly added exercise has no
      // previousPerformance entry yet since it was never part of this
      // session's original exercisesSnapshot fetch at Start Workout.
      if (previousPerformance[exercise.id] === undefined) {
        fetchPreviousPerformance([exercise.id], prev.sessionDate).then((result) => {
          if (result.ok) {
            setPreviousPerformance((current) => ({ ...current, ...result.data }));
          }
        });
      }
    },
    [persist, previousPerformance]
  );

  const handleToggleRecoveryMode = useCallback(() => {
    const prev = sessionRef.current;
    if (!prev) return;
    persist({
      ...prev,
      performance: {
        ...prev.performance,
        modifications: {
          ...prev.performance.modifications,
          recoveryMode: !prev.performance.modifications?.recoveryMode,
        },
      },
    });
  }, [persist]);

  const handleEndWorkoutEarly = useCallback(
    (reason?: EndedEarlyReason) => {
      const prev = sessionRef.current;
      if (!prev) return;
      const nextSlots = { ...prev.performance.slots };
      for (const [slotKey, slot] of Object.entries(nextSlots)) {
        if (slot.status === "upcoming") {
          nextSlots[slotKey] = { ...slot, status: "skipped" };
        }
      }
      persist({
        ...prev,
        performance: {
          ...prev.performance,
          slots: nextSlots,
          currentSlotKey: null,
          modifications: { ...prev.performance.modifications, endedEarly: true, endedEarlyReason: reason },
        },
      });
      setOverviewOpen(false);
    },
    [persist]
  );

  // Lets the athlete finish from the overview at any time, whether or not
  // anything is left upcoming (owner: "at which point I can choose to
  // either finish a workout or go to an exercise that I haven't done").
  // Unlike handleEndWorkoutEarly this never touches slot statuses or
  // records a modification reason — it's just navigation to the completion
  // screen; whether the session ends up Completed or Modified is still
  // decided the normal way at Finish, from whatever the slots actually say.
  const handleGoToFinish = useCallback(() => {
    const prev = sessionRef.current;
    if (!prev) return;
    persist({ ...prev, performance: { ...prev.performance, currentSlotKey: null } });
    setOverviewOpen(false);
  }, [persist]);

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
    // Deterministic, auto-detected at Finish (Phase 5, owner-approved
    // 2026-08-26): any deviation makes this a 'modified' session rather than
    // 'completed'. The completion screen already showed the athlete exactly
    // this list before they tapped Finish (CLAUDE.md non-negotiable 17).
    const deviations = detectSessionDeviations(prev.performance, templateSlots);

    const finalRecord: WorkoutSessionRecord = {
      ...prev,
      status: resolveFinishStatus(deviations),
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
  // A cardio block runs its own clock from the moment the athlete taps
  // Start (cardio-entry-card.tsx); the header's time-on-exercise counter
  // would read as "it started on its own", which is exactly what the owner
  // asked not to happen, so it is hidden for those slots.
  const isCurrentSlotCardio =
    currentTemplateSlot !== null && currentSlotLog !== null
      ? isCardioSlot(
          currentTemplateSlot.section,
          currentSlotLog.chosenExerciseId ? exercises[currentSlotLog.chosenExerciseId] : undefined,
          currentTemplateSlot.exercise.prescription
        )
      : false;

  const liveStats = computeCompletionStats(session.performance, templateSlots);
  // Recomputed on every render, same as liveStats above — cheap over a
  // single day's slots, and the completion screen must always reflect the
  // athlete's CURRENT state, never a stale snapshot (non-negotiable 17:
  // shown before Finish, not decided by it).
  const liveDeviations = detectSessionDeviations(session.performance, templateSlots);
  const recoveryMode = Boolean(session.performance.modifications?.recoveryMode);
  const substitutions = session.performance.modifications?.substitutions ?? [];

  // Names of exercises added mid-workout, for the completion screen's
  // "Added today" line (R10). Resolved the same way session-deviations.ts
  // resolves a slot's display name: the session's own exercisesSnapshot,
  // never the live catalog.
  const addedExerciseNames = (session.performance.modifications?.addedSlotKeys ?? []).map((slotKey) => {
    const slot = session.performance.slots[slotKey];
    const exerciseId = slot?.chosenExerciseId ?? slot?.prescribedExerciseId;
    return exerciseId ? (exercises[exerciseId]?.name ?? exerciseId) : slotKey;
  });

  // What the big advance button on the current exercise reads once it's
  // fully logged (owner request 2026-09-04: never default straight past a
  // finished exercise into the next one automatically — name what tapping
  // it will actually do). Mirrors exactly what advanceFrom/
  // handleQualitativeComplete will compute when that tap actually fires.
  const advanceLabel = (() => {
    if (!currentSlotKey) return "Next exercise";
    const { next, remainingElsewhere } = nextUnfinishedSlotKey(templateSlots, session.performance.slots, currentSlotKey);
    if (next) return "Next exercise";
    if (remainingElsewhere.length > 0) return "Session overview";
    return "Session summary";
  })();

  const viewKey = overviewOpen
    ? "overview"
    : currentSlotKey
      ? `${currentSlotKey}:${currentSlotLog?.chosenExerciseId ?? "choice"}:${currentSlotLog?.sets.length ?? 0}:${currentTemplateSlot?.exercise.prescription.type ?? "none"}`
      : "completion";

  return (
    <div className="flex flex-col gap-5">
      <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between border-b border-line-hairline bg-surface-0/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-3">
          <SessionTimer
            startedAt={session.startedAt}
            endedAt={finishState !== "idle" ? session.completedAt : null}
          />
          {currentSlotKey && !overviewOpen && !isCurrentSlotCardio && slotEnteredAtMs !== null ? (
            <>
              <span className="text-ink-tertiary" aria-hidden="true">
                &middot;
              </span>
              <ExerciseTimer sinceMs={slotEnteredAtMs} />
            </>
          ) : null}
          <SyncStatusBadge synced={synced} />
        </div>
        {finishState === "idle" ? (
          <button
            type="button"
            onClick={() => setOverviewOpen((prev) => !prev)}
            className="rounded-lg px-2 py-1 text-sm font-medium text-ink-secondary transition-colors active:bg-surface-2 active:text-ink-primary"
          >
            {overviewOpen ? "Close" : "Overview"}
          </button>
        ) : null}
      </div>

      {recoveryMode ? (
        <div className="rounded-xl border border-line-default bg-surface-2 px-4 py-3 text-sm text-ink-secondary">
          Recovery mode: reduce loads and effort, skip anything that does not feel right.
        </div>
      ) : null}

      <div key={viewKey} className="workout-slide-in">
        {overviewOpen ? (
          <WorkoutOverview
            templateSlots={templateSlots}
            slotLogs={session.performance.slots}
            currentSlotKey={currentSlotKey}
            exercises={exercises}
            onJump={handleJump}
            onClose={() => setOverviewOpen(false)}
            recoveryMode={recoveryMode}
            onToggleRecoveryMode={handleToggleRecoveryMode}
            onEndWorkoutEarly={handleEndWorkoutEarly}
            onGoToFinish={handleGoToFinish}
            onAddExercise={handleAddExercise}
          />
        ) : currentTemplateSlot && currentSlotLog ? (
          <ExerciseSlotView
            templateSlot={currentTemplateSlot}
            slotLog={currentSlotLog}
            previousPerformance={previousPerformance}
            exercises={exercises}
            showRir={athleteSettings.showRir}
            advanceLabel={advanceLabel}
            onChoose={(exerciseId) => handleChoose(currentTemplateSlot.slotKey, exerciseId)}
            onLogSet={(set) => handleLogSet(currentTemplateSlot.slotKey, set)}
            onRemoveCurrentSet={() => handleRemoveCurrentSet(currentTemplateSlot.slotKey)}
            onDeleteSet={(setNumber) => handleDeleteSet(currentTemplateSlot.slotKey, setNumber)}
            onAddExtraSet={() => handleAddExtraSet(currentTemplateSlot.slotKey)}
            onAdvance={() => advanceFrom(currentTemplateSlot.slotKey, "completed")}
            onSkip={() => advanceFrom(currentTemplateSlot.slotKey, "skipped")}
            onSetNote={(note) => handleSetNote(currentTemplateSlot.slotKey, note)}
            onQualitativeComplete={() => handleQualitativeComplete(currentTemplateSlot.slotKey)}
            onDraftChange={(draft) => handleDraftChange(currentTemplateSlot.slotKey, draft)}
            reducedLoad={(session.performance.modifications?.reducedLoadSlotKeys ?? []).includes(
              currentTemplateSlot.slotKey
            )}
            onToggleReducedLoad={() => handleToggleReducedLoad(currentTemplateSlot.slotKey)}
            hasSubstitution={substitutions.some((sub) => sub.slotKey === currentTemplateSlot.slotKey)}
            onSwap={(exercise) => handleSwap(currentTemplateSlot.slotKey, exercise)}
            onRevertSwap={() => handleRevertSwap(currentTemplateSlot.slotKey)}
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
            deviations={liveDeviations}
            endedEarlyReason={session.performance.modifications?.endedEarlyReason}
            addedExerciseNames={addedExerciseNames}
            onAddExercise={handleAddExercise}
          />
        )}
      </div>
    </div>
  );
}
