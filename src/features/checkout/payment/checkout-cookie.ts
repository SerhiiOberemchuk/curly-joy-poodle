import "server-only";

import { cookies } from "next/headers";

const COOKIE_NAME = "cjp_liqpay_checkout";
/** A LiqPay session is short-lived; so is the handover that starts it. */
const MAX_AGE_SECONDS = 60 * 15;

export interface LiqPayCheckoutSession {
  orderId: string;
  /** Minor units, so the handover page can show the sum without a store read. */
  amount: number;
  /** Simulated payment: the page renders the local stand-in, not LiqPay. */
  mock: boolean;
  data: string;
  signature: string;
}

export async function writeLiqPayCheckoutCookie(
  session: LiqPayCheckoutSession,
): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearLiqPayCheckoutCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function readLiqPayCheckoutCookie(): Promise<LiqPayCheckoutSession | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;

    const value = parsed as Record<string, unknown>;
    if (
      typeof value.orderId !== "string" ||
      typeof value.data !== "string" ||
      typeof value.signature !== "string" ||
      typeof value.amount !== "number" ||
      typeof value.mock !== "boolean"
    ) {
      return null;
    }
    // A signed handover with nothing to post is unusable — treat it as absent.
    if (!value.mock && !value.data) return null;

    return {
      orderId: value.orderId,
      amount: value.amount,
      mock: value.mock,
      data: value.data,
      signature: value.signature,
    };
  } catch {
    return null;
  }
}
