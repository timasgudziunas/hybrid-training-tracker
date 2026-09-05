"use client";

import { useEffect, useRef, useState } from "react";

/** How far a swipe must open before the red Delete button is fully
 * revealed and a release snaps it open rather than back closed. */
const REVEAL_WIDTH = 88;
/** Horizontal movement below this, in pixels, is a tap, not a drag — lets a
 * plain tap still open the edit form (owner request 2026-09-04: "swipe
 * left to delete a set" without adding a confirmation dialog or losing the
 * existing tap-to-edit gesture). */
const DRAG_THRESHOLD_PX = 6;

/**
 * One committed-set row with a swipe-left-to-delete gesture (owner request
 * 2026-09-04: "after completing an exercise and going back to it, I want
 * to be able to delete a set by swiping left on it"). Pointer-event driven
 * so it works with touch and mouse alike; `touch-action: pan-y` keeps
 * vertical scrolling working while a horizontal drag is in progress.
 *
 * Deletion only ever happens by tapping the revealed Delete button — never
 * from the swipe gesture itself, and never behind a confirmation dialog
 * (product rule: no unnecessary confirmations). A plain tap with no
 * horizontal movement opens the existing edit form instead (exercise-entry-
 * card.tsx's EditSetForm), exactly as tapping the row already did.
 *
 * Only one row is meant to be open at a time — the parent (exercise-entry-
 * card.tsx) owns `isOpen`/`onOpenChange` as shared state across all its set
 * rows, closing whichever one was open when a different row opens.
 */
export default function SwipeableSetRow({
  isOpen,
  onOpenChange,
  onTap,
  onDelete,
  children,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onTap: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}) {
  const [translateX, setTranslateX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startTranslate: number; dragging: boolean; translate: number } | null>(null);

  // Keep the rest position in sync when the parent closes this row because
  // a different one opened, or because a delete/edit elsewhere reset state.
  // The setState call is nested inside an inner function, per this
  // project's react-hooks/set-state-in-effect rule, rather than sitting
  // directly in the effect body.
  useEffect(() => {
    function syncRestPosition() {
      setTranslateX(isOpen ? -REVEAL_WIDTH : 0);
    }
    syncRestPosition();
  }, [isOpen]);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    dragRef.current = {
      startX: e.clientX,
      startTranslate: isOpen ? -REVEAL_WIDTH : 0,
      dragging: false,
      translate: isOpen ? -REVEAL_WIDTH : 0,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const state = dragRef.current;
    if (!state) return;
    const delta = e.clientX - state.startX;
    if (Math.abs(delta) > DRAG_THRESHOLD_PX) {
      state.dragging = true;
      setDragging(true);
    }
    const next = Math.min(0, Math.max(-REVEAL_WIDTH, state.startTranslate + delta));
    state.translate = next;
    setTranslateX(next);
  }

  // The browser cancels the pointer when it takes over for a vertical
  // scroll (touch-action: pan-y). That is neither a tap nor a completed
  // swipe: snap back to the rest position and do nothing else, otherwise a
  // scroll that started on a set row would open its edit form.
  function handlePointerCancel() {
    dragRef.current = null;
    setDragging(false);
    setTranslateX(isOpen ? -REVEAL_WIDTH : 0);
  }

  function handlePointerUp() {
    const state = dragRef.current;
    dragRef.current = null;
    setDragging(false);
    if (!state) return;

    if (!state.dragging) {
      // A plain tap: on a closed row this opens the edit form; on an
      // already-open row (tapping the visible part outside Delete) it just
      // snaps closed, per the swipe-to-reveal convention.
      if (isOpen) {
        setTranslateX(0);
        onOpenChange(false);
      } else {
        onTap();
      }
      return;
    }

    const shouldOpen = state.translate <= -REVEAL_WIDTH / 2;
    setTranslateX(shouldOpen ? -REVEAL_WIDTH : 0);
    onOpenChange(shouldOpen);
  }

  return (
    <div className="relative overflow-hidden rounded-lg">
      <div className="absolute inset-y-0 right-0 flex" style={{ width: REVEAL_WIDTH }}>
        <button
          type="button"
          onClick={() => {
            setTranslateX(0);
            onDelete();
          }}
          className="flex w-full items-center justify-center bg-danger text-sm font-semibold text-accent-ink transition-colors active:bg-danger/80"
        >
          Delete
        </button>
      </div>
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: dragging ? "none" : "transform 150ms ease-out",
          touchAction: "pan-y",
        }}
        className="relative bg-surface-1"
      >
        {children}
      </div>
    </div>
  );
}
