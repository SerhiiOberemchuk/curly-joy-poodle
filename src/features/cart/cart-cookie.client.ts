"use client";

import { parseCartCookie, parseCartSnapshot } from "./cart-cookie-data";
import { CART_COOKIE, CART_COOKIE_MAX_AGE_SECONDS, MAX_CART_LINES } from "./constants";
import type { StoredCartLine } from "./types";

const CART_CHANGE_EVENT = "cjp-cart-change";

export function subscribeBrowserCart(listener: () => void) {
  window.addEventListener(CART_CHANGE_EVENT, listener);
  return () => window.removeEventListener(CART_CHANGE_EVENT, listener);
}

function browserCookieValue(): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie.split(";").map((part) => part.trim())
    .find((part) => part.startsWith(`${CART_COOKIE}=`))
    ?.slice(CART_COOKIE.length + 1);
}

export function browserCartItemCount(): number | null {
  const raw = browserCookieValue();
  if (raw === undefined) return null;
  return parseCartCookie(raw).reduce((count, line) => count + line.q, 0);
}

function writeBrowserCart(lines: readonly StoredCartLine[]): "saved" | "unavailable" {
  const value = encodeURIComponent(JSON.stringify({ revision: crypto.randomUUID(), lines }));
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CART_COOKIE}=${value}; Path=/; Max-Age=${CART_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
  if (!document.cookie.split(";").some((part) => part.trim() === `${CART_COOKIE}=${value}`))
    return "unavailable";
  window.dispatchEvent(new window.Event(CART_CHANGE_EVENT));
  return "saved";
}

/** Migrate a legacy basket before the request captures its cookie snapshot. */
export function ensureBrowserCartRevision(shown: readonly StoredCartLine[]): void {
  const raw = browserCookieValue();
  const snapshot = parseCartSnapshot(raw);
  if (!snapshot.revision) writeBrowserCart(raw === undefined ? shown : snapshot.lines);
}

/** Check at response time, without an await that could erase a newer edit. */
export function clearPurchasedCart(revision: string): boolean {
  if (parseCartSnapshot(browserCookieValue()).revision !== revision) return false;
  return writeBrowserCart([]) === "saved";
}

/**
 * Sets one line's quantity, or removes it with `null`, leaving every other
 * stored line as it is — including lines another tab changed and lines the
 * open page does not show. Checkout re-reads the whole cookie against fresh
 * CRM stock. A browser cookie write does not invoke a Server Action or
 * re-render the route.
 *
 * `shown` is the cart the page rendered. While only the older HttpOnly cookie
 * holds a cart, the browser cannot read it, so the first write starts from the
 * rendered lines instead of an empty cart that would drop the others.
 */
export function writeBrowserCartLine(
  variantId: string,
  quantity: number | null,
  shown: readonly StoredCartLine[],
): "saved" | "full" | "unavailable" {
  if (typeof document === "undefined") return "unavailable";
  const raw = browserCookieValue();
  const current = raw === undefined ? [...shown] : parseCartCookie(raw);
  const next: StoredCartLine[] =
    quantity === null
      ? current.filter((line) => line.p !== variantId)
      : current.some((line) => line.p === variantId)
        ? current.map((line) => (line.p === variantId ? { p: variantId, q: quantity } : line))
        : [...current, { p: variantId, q: quantity }];
  if (next.length > MAX_CART_LINES) return "full";
  return writeBrowserCart(next);
}
