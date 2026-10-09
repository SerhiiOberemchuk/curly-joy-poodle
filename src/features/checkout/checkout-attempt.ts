import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { sealData, unsealData } from "iron-session";
import { z } from "zod";
import type { StoredCartLine } from "@/features/cart/types";
import { getCheckoutSession, getCheckoutSessionPassword } from "./session";

const tokenSchema = z.object({ id: z.uuid(), purpose: z.literal("checkout") });
const TOKEN_TTL = 24 * 60 * 60;

export async function createCheckoutToken(): Promise<string> {
  return sealData({ id: randomUUID(), purpose: "checkout" }, { password: getCheckoutSessionPassword(), ttl: TOKEN_TTL });
}

export async function readCheckoutToken(token: string): Promise<string | null> {
  const decoded = await unsealData<unknown>(token, { password: getCheckoutSessionPassword(), ttl: TOKEN_TTL });
  const parsed = tokenSchema.safeParse(decoded);
  return parsed.success ? parsed.data.id : null;
}

export function cartFingerprint(lines: readonly StoredCartLine[]): string {
  const ordered = [...lines].sort((a, b) => a.p.localeCompare(b.p));
  return createHash("sha256").update(JSON.stringify(ordered)).digest("hex");
}

export async function checkoutAttempt(payload: unknown, nonce: string): Promise<string> {
  const fingerprint = createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
  const session = await getCheckoutSession();
  if (session.attempt?.fingerprint === fingerprint) return session.attempt.id;

  // Concurrent requests from the same signed form must reach CRM with the same key.
  const id = `CJ-${createHash("sha256").update(`${nonce}:${fingerprint}`).digest("hex")}`;
  session.attempt = { fingerprint, id };
  await session.save();
  return id;
}
