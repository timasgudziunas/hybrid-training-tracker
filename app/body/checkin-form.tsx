"use client";

import { useActionState, useRef } from "react";
import { createPhotoUploadTarget, saveCheckin, type SaveCheckinState } from "./actions";

const initialState: SaveCheckinState = { success: false };
const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/webp": "webp",
  "image/gif": "gif",
};

function extensionFromFile(file: File): string {
  const nameExt = file.name.includes(".") ? file.name.split(".").pop() : undefined;
  if (nameExt && /^[a-zA-Z0-9]{1,8}$/.test(nameExt)) {
    return nameExt.toLowerCase();
  }
  return MIME_TO_EXTENSION[file.type] ?? "bin";
}

// Photos upload straight from the browser to Supabase Storage via a signed
// URL; only the resulting path goes through the server action. Routing the
// bytes through the action dies at Vercel's function payload cap.
async function uploadPhotoDirect(date: string, file: File): Promise<{ path?: string; error?: string }> {
  if (file.size > MAX_PHOTO_BYTES) {
    return { error: "Photo is too large (max 15 MB)." };
  }

  const target = await createPhotoUploadTarget(date, extensionFromFile(file));
  if ("error" in target) {
    return { error: target.error };
  }

  const response = await fetch(target.signedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });

  if (!response.ok) {
    return { error: "Photo upload failed. Try again." };
  }

  return { path: target.path };
}

export default function CheckinForm({
  date,
  existing,
  onSaved,
  submitLabel = "Save",
}: {
  date: string;
  existing: { weightLbs: number; hasPhoto: boolean } | null;
  onSaved?: () => void;
  submitLabel?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState(async (prev: SaveCheckinState, formData: FormData) => {
    const photo = formData.get("photo");
    formData.delete("photo");

    if (photo instanceof File && photo.size > 0) {
      try {
        const uploaded = await uploadPhotoDirect(date, photo);
        if (uploaded.error || !uploaded.path) {
          return { success: false, error: uploaded.error ?? "Photo upload failed. Try again." };
        }
        formData.set("photo_path", uploaded.path);
      } catch (err) {
        console.error("[checkin-form] Direct photo upload failed:", err);
        return { success: false, error: "Photo upload failed. Check your connection and try again." };
      }
    }

    const result = await saveCheckin(prev, formData);
    if (result.success) {
      formRef.current?.reset();
      onSaved?.();
    }
    return result;
  }, initialState);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="date" value={date} />

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">Bodyweight (lbs)</span>
        <input
          type="number"
          name="weight"
          inputMode="decimal"
          step="0.1"
          min="1"
          max="999"
          defaultValue={existing?.weightLbs ?? ""}
          required
          className="h-14 rounded-xl border border-line-default bg-surface-2 px-4 font-display text-2xl tabular-nums text-ink-primary shadow-well transition-colors focus:border-accent focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">
          Progress photo {existing?.hasPhoto ? "(optional, replaces current)" : "(optional)"}
        </span>
        <input
          type="file"
          name="photo"
          accept="image/*"
          className="text-sm text-ink-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-surface-3 file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink-primary"
        />
      </label>

      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="h-12 rounded-xl bg-accent text-sm font-semibold text-accent-ink transition-colors active:bg-accent-strong disabled:opacity-50"
      >
        {isPending ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
