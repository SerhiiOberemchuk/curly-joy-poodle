import "server-only";

import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import type { OrderReceipt } from "./types";

interface CheckoutSession {
  receipt?: OrderReceipt;
  attempt?: { fingerprint: string; id: string };
}

export async function getCheckoutSession() {
  const password =
    process.env.CHECKOUT_SESSION_PASSWORD ?? process.env.OBRIYM_CRM_API_KEY;
  if (!password || password.length < 32) {
    throw new Error(
      "Checkout session requires a secret of at least 32 characters.",
    );
  }

  return getIronSession<CheckoutSession>(await cookies(), {
    password,
    cookieName: "cjp_checkout",
    ttl: 24 * 60 * 60,
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
  });
}
