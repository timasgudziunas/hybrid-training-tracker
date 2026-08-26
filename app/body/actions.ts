"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";

const PHOTO_BUCKET = "progress-photos";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type SaveCheckinState = { success: boolean; error?: string };

export type CheckinLookup = {
  exists: boolean;
  weightLbs: number | null;
  hasPhoto: boolean;
  error?: string;
};

const EXTENSION_PATTERN = /^[a-z0-9]{1,8}$/;

export type PhotoUploadTarget = { path: string; signedUrl: string } | { error: string };

// Photos never travel through a server action: Vercel caps function request
// payloads (~4.5 MB) well below a phone photo. The client asks for this
// signed upload URL, PUTs the file straight to Supabase Storage, then saves
// the check-in with only the resulting path.
export async function createPhotoUploadTarget(date: string, extension: string): Promise<PhotoUploadTarget> {
  if (!DATE_PATTERN.test(date) || !EXTENSION_PATTERN.test(extension)) {
    return { error: "Invalid photo upload request." };
  }

  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch (err) {
    console.error("[body/actions] Supabase client init failed:", err);
    return { error: "Storage is not configured." };
  }

  const path = `${date}.${extension}`;
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUploadUrl(path, { upsert: true });

  if (error || !data) {
    console.error("[body/actions] Signed upload URL failed:", error);
    return { error: "Could not start the photo upload. Try again." };
  }

  return { path: data.path, signedUrl: data.signedUrl };
}

export async function getCheckinByDate(date: string): Promise<CheckinLookup> {
  if (!DATE_PATTERN.test(date)) {
    return { exists: false, weightLbs: null, hasPhoto: false, error: "Invalid date." };
  }

  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch (err) {
    console.error("[body/actions] Supabase client init failed:", err);
    return { exists: false, weightLbs: null, hasPhoto: false, error: "Storage is not configured." };
  }

  const { data, error } = await supabase
    .from("body_checkins")
    .select("weight_lbs, photo_path")
    .eq("checkin_date", date)
    .maybeSingle();

  if (error) {
    console.error("[body/actions] Check-in lookup failed:", error);
    return { exists: false, weightLbs: null, hasPhoto: false, error: "Could not check today's entry." };
  }

  if (!data) {
    return { exists: false, weightLbs: null, hasPhoto: false };
  }

  return { exists: true, weightLbs: data.weight_lbs, hasPhoto: Boolean(data.photo_path) };
}

export async function saveCheckin(
  _prevState: SaveCheckinState,
  formData: FormData
): Promise<SaveCheckinState> {
  const date = formData.get("date");
  const weightRaw = formData.get("weight");
  const photoPathRaw = formData.get("photo_path");

  if (typeof date !== "string" || !DATE_PATTERN.test(date)) {
    return { success: false, error: "Missing or invalid date." };
  }

  const weight = typeof weightRaw === "string" ? Number.parseFloat(weightRaw) : NaN;
  if (!Number.isFinite(weight) || weight <= 0 || weight > 999.9) {
    return { success: false, error: "Enter a valid bodyweight." };
  }

  // photo_path is set by the client only after a successful direct upload to
  // the bucket; it must be exactly this date's file, nothing else.
  let photoPath: string | null = null;
  if (typeof photoPathRaw === "string" && photoPathRaw.length > 0) {
    if (!new RegExp(`^${date}\\.[a-z0-9]{1,8}$`).test(photoPathRaw)) {
      return { success: false, error: "Invalid photo reference." };
    }
    photoPath = photoPathRaw;
  }

  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch (err) {
    console.error("[body/actions] Supabase client init failed:", err);
    return { success: false, error: "Storage is not configured." };
  }

  const upsertPayload: { checkin_date: string; weight_lbs: number; photo_path?: string } = {
    checkin_date: date,
    weight_lbs: weight,
  };
  if (photoPath) {
    upsertPayload.photo_path = photoPath;
  }

  const { error: upsertError } = await supabase
    .from("body_checkins")
    .upsert(upsertPayload, { onConflict: "checkin_date" });

  if (upsertError) {
    console.error("[body/actions] Check-in save failed:", upsertError);
    return { success: false, error: "Save failed. Try again." };
  }

  revalidatePath("/body");
  revalidatePath("/");

  return { success: true };
}
