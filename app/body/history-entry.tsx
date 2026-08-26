"use client";

import { useState } from "react";
import CheckinForm from "./checkin-form";
import PhotoLightbox from "./photo-lightbox";

// One history row: thumbnail (tap to enlarge), date + weight, and an Edit
// toggle that expands the shared check-in form inline for that date.
export default function HistoryEntry({
  date,
  weightLbs,
  hasPhoto,
  photoUrl,
}: {
  date: string;
  weightLbs: number;
  hasPhoto: boolean;
  photoUrl: string | null;
}) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <li className="flex flex-col py-3">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-zinc-900">
          {photoUrl ? (
            <PhotoLightbox url={photoUrl} date={date} weightLbs={weightLbs} />
          ) : (
            <span className="text-center text-[10px] leading-tight text-zinc-600">No photo</span>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-white">{date}</span>
          <span className="text-sm text-zinc-400">{weightLbs.toFixed(1)} lbs</span>
        </div>
        <button
          type="button"
          onClick={() => setIsEditing((editing) => !editing)}
          className="ml-auto rounded-md border border-zinc-800 px-3 py-1.5 text-sm text-zinc-400 hover:text-white"
        >
          {isEditing ? "Cancel" : "Edit"}
        </button>
      </div>

      {isEditing ? (
        <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <CheckinForm
            date={date}
            existing={{ weightLbs, hasPhoto }}
            submitLabel="Update"
            onSaved={() => setIsEditing(false)}
          />
        </div>
      ) : null}
    </li>
  );
}
