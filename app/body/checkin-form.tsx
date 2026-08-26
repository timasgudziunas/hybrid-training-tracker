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
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="date" value={date} />

      <label className="flex flex-col gap-1 text-sm text-zinc-300">
        Bodyweight (lbs)
        <input
          type="number"
          name="weight"
          inputMode="decimal"
          step="0.1"
          min="1"
          max="999"
          defaultValue={existing?.weightLbs ?? ""}
          required
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-3 text-lg text-white focus:border-zinc-400 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-zinc-300">
        Progress photo {existing?.hasPhoto ? "(optional, replaces current)" : "(optional)"}
        <input
          type="file"
          name="photo"
          accept="image/*"
          className="text-sm text-zinc-400 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-zinc-200"
        />
      </label>

      {state.error ? <p className="text-sm text-red-400">{state.error}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-white px-4 py-3 font-medium text-black disabled:opacity-50"
      >
        {isPending ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
