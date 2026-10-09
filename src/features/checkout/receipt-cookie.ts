import "server-only";

import { getCheckoutSession } from "./session";
import type { OrderReceipt } from "./types";

export async function writeReceiptCookie(receipt: OrderReceipt): Promise<void> {
  const session = await getCheckoutSession();
  session.receipt = receipt;
  if (receipt.status === "paid" || receipt.payment === "cod" ||
    receipt.status === "cancelled" || receipt.status === "refunded" ||
    receipt.status === "partially-refunded") delete session.attempt;
  await session.save();
}

export async function readReceiptCookie(): Promise<OrderReceipt | null> {
  return (await getCheckoutSession()).receipt ?? null;
}
