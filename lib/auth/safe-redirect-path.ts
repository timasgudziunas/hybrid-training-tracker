/** Only ever redirect within the app after auth: a same-origin path that is
 * not protocol-relative. Anything else falls back to Today. */
export function safeRedirectPath(value: unknown): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}
