// HMAC-based session cookie for the single-passphrase access gate.
//
// The cookie never stores the passphrase itself. Instead it stores an
// HMAC-SHA256 of a fixed message, keyed by APP_PASSPHRASE. Middleware
// recomputes the same HMAC from the current env var and compares. Because
// the key comes from the current env var on every request, rotating
// APP_PASSPHRASE immediately invalidates every previously issued cookie on
// every device, with no session store required.
//
// Uses Web Crypto (globalThis.crypto.subtle) so this module runs unchanged
// in both the Edge middleware runtime and Node server actions.

export const SESSION_COOKIE_NAME = "htt_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // ~1 year

const SIGNED_MESSAGE = "hybrid-training-tracker:unlock:v1";

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signatureBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function computeSessionToken(passphrase: string): Promise<string> {
  return hmacSha256Hex(passphrase, SIGNED_MESSAGE);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function isValidSessionToken(
  token: string | undefined | null,
  passphrase: string
): Promise<boolean> {
  if (!token) return false;
  const expected = await computeSessionToken(passphrase);
  return timingSafeEqual(token, expected);
}
