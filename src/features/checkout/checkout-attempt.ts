import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { sealData, unsealData } from "iron-session";
import { z } from "zod";
import { getCheckoutSessionPassword } from "./session";

const tokenSchema = z.object({ id: z.uuid(), purpose: z.literal("checkout") });
const TOKEN_TTL = 24 * 60 * 60;

export async function createCheckoutToken(): Promise<string> {
  return sealData(
    { id: randomUUID(), purpose: "checkout" },
    { password: getCheckoutSessionPassword(), ttl: TOKEN_TTL },
  );
}

export async function readCheckoutToken(token: string): Promise<string | null> {
  const decoded = await unsealData<unknown>(token, {
    password: getCheckoutSessionPassword(),
    ttl: TOKEN_TTL,
  });
  const parsed = tokenSchema.safeParse(decoded);
  return parsed.success ? parsed.data.id : null;
}

/**
 * The order's idempotency key: the same form token and the same order give the
 * same key, so retries and concurrent submits reach the CRM as one order. A new
 * form token is a new order, even for an identical basket and address — a
 * finished purchase this browser never saw settle must not swallow it.
 */
export function checkoutAttempt(payload: unknown, nonce: string): string {
  const fingerprint = createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
  return `CJ-${createHash("sha256").update(`${nonce}:${fingerprint}`).digest("hex")}`;
}
