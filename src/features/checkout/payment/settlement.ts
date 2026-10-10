import "server-only";
import { readCartCookie, writeCartCookie } from "@/features/cart/cart-cookie";
import { cartFingerprint } from "../checkout-attempt";
import { getCrmOrder } from "../crm";
import { writeReceiptCookie } from "../receipt-cookie";
import { readPaymentReceipt } from "./return-receipt";
import type { CrmOrder } from "../crm/types";
import type { OrderReceipt } from "../types";
import { crmPaymentStatus, paymentNote } from "./status";

export async function currentReceipt(
  receipt: OrderReceipt,
): Promise<{ receipt: OrderReceipt; order: CrmOrder }> {
  const order = await getCrmOrder(receipt.number);
  if (order.currency !== "UAH" || !Number.isFinite(Number(order.totalAmount)))
    throw new Error("Unsupported CRM order currency.");
  const status = crmPaymentStatus(order, receipt.payment);
  return {
    order,
    receipt: {
      ...receipt,
      total: Math.round(Number(order.totalAmount) * 100),
      crmReference: order.number ?? receipt.crmReference,
      status,
      note: paymentNote(status, receipt.payment),
    },
  };
}
/** Run only in actions/route handlers, where cookie writes are supported. */
export async function settleCheckoutReturn(token?: string): Promise<OrderReceipt | null> {
  const receipt = await readPaymentReceipt(token);
  if (!receipt) return null;
  const { receipt: current } = await currentReceipt(receipt);
  await writeReceiptCookie(current);
  // A buyer may have started a new basket while paying for the previous one.
  if (
    (current.status === "paid" || current.payment === "cod") &&
    cartFingerprint(await readCartCookie()) === current.cartFingerprint
  ) {
    await writeCartCookie([]);
  }
  return current;
}
