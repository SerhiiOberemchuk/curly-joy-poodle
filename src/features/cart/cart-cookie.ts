import "server-only";

import { cookies } from "next/headers";

import type { SizeCode } from "@/features/catalog/types";
import { CART_COOKIE, MAX_CART_LINES, MAX_LINE_QUANTITY } from "./constants";
import type { StoredCartLine } from "./types";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/**
 * The cookie is user-writable, so every field is validated before it reaches
 * the rest of the app. Anything unexpected is dropped rather than thrown on:
 * a corrupt cookie should degrade to an empty cart, never to an error page.
 */
function parse(raw: string | undefined): StoredCartLine[] {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((entry): StoredCartLine[] => {
      if (typeof entry !== "object" || entry === null) return [];
      const { p, s, q } = entry as Record<string, unknown>;
      if (typeof p !== "string" || typeof s !== "string") return [];
      if (typeof q !== "number" || !Number.isInteger(q) || q < 1) return [];

      return [{ p, s: s as SizeCode, q: Math.min(q, MAX_LINE_QUANTITY) }];
    });
  } catch {
    return [];
  }
}

/** Reads the cart cookie. Dynamic — call it behind a `<Suspense>` boundary. */
export async function readCartCookie(): Promise<StoredCartLine[]> {
  const store = await cookies();
  return parse(store.get(CART_COOKIE)?.value);
}

/** Writes the cart cookie. Only valid inside a Server Action or Route Handler. */
export async function writeCartCookie(lines: StoredCartLine[]): Promise<void> {
  const store = await cookies();

  if (lines.length === 0) {
    store.delete(CART_COOKIE);
    return;
  }

  store.set(CART_COOKIE, JSON.stringify(lines.slice(0, MAX_CART_LINES)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}
