import "server-only";

import { cookies } from "next/headers";

import { isPaymentMethod } from "./options";
import type { OrderReceipt } from "./types";

const RECEIPT_COOKIE = "cjp_receipt";
/** Long enough to survive a refresh or a back-and-forward, short enough to expire on its own. */
const RECEIPT_MAX_AGE_SECONDS = 60 * 30;

export async function writeReceiptCookie(receipt: OrderReceipt): Promise<void> {
  const store = await cookies();

  store.set(RECEIPT_COOKIE, JSON.stringify(receipt), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: RECEIPT_MAX_AGE_SECONDS,
  });
}

export async function readReceiptCookie(): Promise<OrderReceipt | null> {
  const store = await cookies();
  const raw = store.get(RECEIPT_COOKIE)?.value;
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;

    const receipt = parsed as Record<string, unknown>;
    if (typeof receipt.number !== "string") return null;
    if (typeof receipt.total !== "number") return null;
    if (typeof receipt.payment !== "string" || !isPaymentMethod(receipt.payment)) return null;

    return {
      number: receipt.number,
      total: receipt.total,
      payment: receipt.payment,
      note: String(receipt.note ?? ""),
      email: String(receipt.email ?? ""),
      phone: String(receipt.phone ?? ""),
      city: String(receipt.city ?? ""),
      destination: String(receipt.destination ?? ""),
    };
  } catch {
    return null;
  }
}
