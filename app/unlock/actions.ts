"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  computeSessionToken,
} from "@/lib/auth/passphrase-cookie";

export type UnlockState = { error?: string };

export async function unlockAction(_prevState: UnlockState, formData: FormData): Promise<UnlockState> {
  const configuredPassphrase = process.env.APP_PASSPHRASE;
  const entered = formData.get("passphrase");
  const redirectField = formData.get("redirect");
  const redirectPath =
    typeof redirectField === "string" && redirectField.startsWith("/") && !redirectField.startsWith("//")
      ? redirectField
      : "/";

  if (!configuredPassphrase) {
    return { error: "APP_PASSPHRASE is not configured on the server." };
  }

  if (typeof entered !== "string" || entered.length === 0) {
    return { error: "Enter the passphrase." };
  }

  if (entered !== configuredPassphrase) {
    return { error: "Wrong passphrase." };
  }

  const token = await computeSessionToken(configuredPassphrase);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  redirect(redirectPath);
}
