import "server-only";

import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

import { parseCartSnapshot } from "./cart-cookie-data";
import { CART_COOKIE, CART_COOKIE_MAX_AGE_SECONDS, LEGACY_CART_COOKIE, MAX_CART_LINES } from "./constants";
import type { StoredCartLine } from "./types";

/** Reads the cart cookie. Dynamic — call it behind a `<Suspense>` boundary. */
export async function readCartCookie(): Promise<StoredCartLine[]> {
  return (await readCartSnapshot()).lines;
}

export async function readCartSnapshot() {
  const store = await cookies();
  const current = store.get(CART_COOKIE);
  const raw = current ? current.value : store.get(LEGACY_CART_COOKIE)?.value;
  return parseCartSnapshot(raw);
}

/** Writes the cart cookie. Only valid inside a Server Action or Route Handler. */
export async function writeCartCookie(lines: StoredCartLine[]): Promise<void> {
  const store = await cookies();

  // Revision and lines travel together, including an empty-cart marker.
  store.set(
    CART_COOKIE,
    JSON.stringify({
      revision: randomUUID(),
      lines: lines.slice(0, MAX_CART_LINES),
    }),
    {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: CART_COOKIE_MAX_AGE_SECONDS,
    },
  );
  store.delete(LEGACY_CART_COOKIE);
}
