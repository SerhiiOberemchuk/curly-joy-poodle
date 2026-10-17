"use client";

import { parseCartCookie } from "./cart-cookie-data";
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

/**
 * Sets one line's quantity, or removes it with `null`, leaving every other
 * stored line as it is — including lines another tab changed and lines the
 * open page does not show. Checkout re-reads the whole cookie against fresh
 * CRM stock. A browser cookie write does not invoke a Server Action or
 * re-render the route.
 */
export function writeBrowserCartLine(
  variantId: string,
  quantity: number | null,
): "saved" | "full" | "unavailable" {
  if (typeof document === "undefined") return "unavailable";
  const current = parseCartCookie(browserCookieValue());
  const next: StoredCartLine[] =
    quantity === null
      ? current.filter((line) => line.p !== variantId)
      : current.some((line) => line.p === variantId)
        ? current.map((line) => (line.p === variantId ? { p: variantId, q: quantity } : line))
        : [...current, { p: variantId, q: quantity }];
  if (next.length > MAX_CART_LINES) return "full";
  const value = encodeURIComponent(JSON.stringify(next));
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CART_COOKIE}=${value}; Path=/; Max-Age=${CART_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
  if (!document.cookie.split(";").some((part) => part.trim() === `${CART_COOKIE}=${value}`))
    return "unavailable";
  window.dispatchEvent(new window.Event(CART_CHANGE_EVENT));
  return "saved";
}
