import { MAX_CART_LINES } from "./constants";
import { z } from "zod";
import type { StoredCartLine } from "./types";

const snapshotSchema = z.object({ revision: z.uuid(), lines: z.array(z.unknown()) });

/** Cookie data is user-writable and must be validated on both sides. */
export function parseCartSnapshot(raw: string | undefined): {
  lines: StoredCartLine[];
  revision?: string;
} {
  const empty = { lines: [] };
  if (!raw) return empty;
  try {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = JSON.parse(decodeURIComponent(raw));
    }
    const snapshot = snapshotSchema.safeParse(parsed);
    const entries = snapshot.success ? snapshot.data.lines : parsed;
    if (!Array.isArray(entries)) return empty;
    const quantities = new Map<string, number>();
    for (const entry of entries) {
      if (!entry || typeof entry !== "object") continue;
      const { p, q } = entry as Record<string, unknown>;
      if (typeof p !== "string" || !p || typeof q !== "number" ||
        !Number.isSafeInteger(q) || q < 1) continue;
      const quantity = (quantities.get(p) ?? 0) + q;
      if (!Number.isSafeInteger(quantity)) return empty;
      quantities.set(p, quantity);
      if (quantities.size > MAX_CART_LINES) return empty;
    }
    return {
      lines: Array.from(quantities, ([p, q]) => ({ p, q })),
      ...(snapshot.success ? { revision: snapshot.data.revision } : {}),
    };
  } catch {
    return empty;
  }
}

export function parseCartCookie(raw: string | undefined): StoredCartLine[] {
  return parseCartSnapshot(raw).lines;
}
