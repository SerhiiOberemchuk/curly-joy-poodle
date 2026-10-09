import "server-only";

import { createHash, randomUUID } from "node:crypto";
import type { StoredCartLine } from "@/features/cart/types";
import { getCheckoutSession } from "./session";

export function cartFingerprint(lines: readonly StoredCartLine[]): string {
  const ordered = [...lines].sort((a, b) => a.p.localeCompare(b.p));
  return createHash("sha256").update(JSON.stringify(ordered)).digest("hex");
}

export async function checkoutAttempt(payload: unknown): Promise<string> {
  const fingerprint = createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
  const session = await getCheckoutSession();
  if (session.attempt?.fingerprint === fingerprint) return session.attempt.id;

  const id = `CJ-${randomUUID()}`;
  session.attempt = { fingerprint, id };
  await session.save();
  return id;
}
