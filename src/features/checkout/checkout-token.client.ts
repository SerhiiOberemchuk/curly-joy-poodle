"use client";

const STORAGE_KEY = "cjp-checkout-token";
// Long enough to retry after a lost response, well inside the token's 24 h life.
const REUSE_MS = 60 * 60 * 1000;

function isFresh(value: unknown): value is { token: string; savedAt: number } {
  if (!value || typeof value !== "object") return false;
  const { token, savedAt } = value as Record<string, unknown>;
  if (typeof token !== "string" || !token || typeof savedAt !== "number")
    return false;
  const age = Date.now() - savedAt;
  return age >= 0 && age < REUSE_MS;
}

/**
 * One form token per tab until an order is confirmed. A resubmission after a
 * lost response — even from a form rendered again with a fresh token — keeps
 * the same order key, so the CRM replays the order instead of creating a
 * second one. Without storage the rendered token still covers this form.
 */
export function tabCheckoutToken(rendered: string): string {
  try {
    const stored: unknown = JSON.parse(
      window.sessionStorage.getItem(STORAGE_KEY) ?? "null",
    );
    if (isFresh(stored)) return stored.token;
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ token: rendered, savedAt: Date.now() }),
    );
  } catch {
    /* Storage blocked or corrupt: the rendered token still works. */
  }
  return rendered;
}

/** After a confirmation (or a refused token) the next checkout is a new order. */
export function forgetCheckoutToken(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* Nothing stored. */
  }
}
