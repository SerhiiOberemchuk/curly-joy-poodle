import "server-only";
import { getCrmOrder } from "../crm";
import { readReceiptCookie, writeReceiptCookie } from "../receipt-cookie";
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
  if (JSON.stringify(await readReceiptCookie()) !== JSON.stringify(current))
    await writeReceiptCookie(current);
  // Cart clearing happens in the browser against its revision at response time.
  return current;
}
