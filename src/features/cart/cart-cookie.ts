import "server-only";

import { cookies } from "next/headers";

import { parseCartCookie } from "./cart-cookie-data";
import { CART_COOKIE, CART_COOKIE_MAX_AGE_SECONDS, LEGACY_CART_COOKIE, MAX_CART_LINES } from "./constants";
import type { StoredCartLine } from "./types";

/** Reads the cart cookie. Dynamic — call it behind a `<Suspense>` boundary. */
export async function readCartCookie(): Promise<StoredCartLine[]> {
  const store = await cookies();
  const current = store.get(CART_COOKIE);
  const raw = current ? current.value : store.get(LEGACY_CART_COOKIE)?.value;
  return parseCartCookie(raw);
}

/** Writes the cart cookie. Only valid inside a Server Action or Route Handler. */
export async function writeCartCookie(lines: StoredCartLine[]): Promise<void> {
  const store = await cookies();

  // Keep [] as a marker so an older HttpOnly cookie cannot revive an empty cart.
  store.set(CART_COOKIE, JSON.stringify(lines.slice(0, MAX_CART_LINES)), {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CART_COOKIE_MAX_AGE_SECONDS,
  });
  store.delete(LEGACY_CART_COOKIE);
}
