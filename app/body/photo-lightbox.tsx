"use client";

import { useEffect, useState } from "react";

// Thumbnail that opens the full-size photo in a fullscreen overlay.
// One tap anywhere (or Escape) closes it — no nested UI, no controls.
export default function PhotoLightbox({
  url,
  date,
  weightLbs,
}: {
  url: string;
  date: string;
  weightLbs: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={`Enlarge photo from ${date}`}
        className="h-full w-full"
      >
        {/* Signed Supabase Storage URL; next/image remote-pattern config isn't worth it here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" className="h-full w-full object-cover" />
      </button>

      {isOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Photo from ${date}`}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-surface-0/95 p-4"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="max-h-[85vh] max-w-full rounded-lg object-contain" />
          <p className="text-sm text-ink-secondary">
            {date} &middot; {weightLbs.toFixed(1)} lbs &middot; tap to close
          </p>
        </div>
      ) : null}
    </>
  );
}
