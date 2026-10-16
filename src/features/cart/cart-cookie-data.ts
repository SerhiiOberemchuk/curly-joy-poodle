import { MAX_CART_LINES } from "./constants";
import type { StoredCartLine } from "./types";

/** Cookie data is user-writable and must be validated on both sides. */
export function parseCartCookie(raw: string | undefined): StoredCartLine[] {
  if (!raw) return [];
  try {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = JSON.parse(decodeURIComponent(raw));
    }
    if (!Array.isArray(parsed)) return [];
    const quantities = new Map<string, number>();
    for (const entry of parsed) {
      if (!entry || typeof entry !== "object") continue;
      const { p, q } = entry as Record<string, unknown>;
      if (typeof p !== "string" || !p || typeof q !== "number" ||
        !Number.isSafeInteger(q) || q < 1) continue;
      const quantity = (quantities.get(p) ?? 0) + q;
      if (!Number.isSafeInteger(quantity)) return [];
      quantities.set(p, quantity);
      if (quantities.size > MAX_CART_LINES) return [];
    }
    return Array.from(quantities, ([p, q]) => ({ p, q }));
  } catch {
    return [];
  }
}
