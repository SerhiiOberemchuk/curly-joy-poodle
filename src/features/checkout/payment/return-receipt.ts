import "server-only";
import { getCrmOrder } from "../crm";
import { readReceiptCookie } from "../receipt-cookie";
import type { OrderReceipt } from "../types";
import { readPaymentReturnToken } from "./return-token";
import { crmPaymentStatus, paymentNote } from "./status";

/** A return proof identifies one order; another browser session cannot override it. */
export async function readPaymentReceipt(
  token?: string,
): Promise<OrderReceipt | null> {
  const number = token ? await readPaymentReturnToken(token) : null;
  if (token && !number) return null;
  const saved = await readReceiptCookie();
  if (!number || saved?.number === number) return saved;
  const order = await getCrmOrder(number);
  if (order.externalId !== number || order.currency !== "UAH")
    throw new Error("Invalid CRM order.");
  const status = crmPaymentStatus(order, "card");
  return {
    number,
    total: Math.round(Number(order.totalAmount) * 100),
    payment: "card",
    status,
    note: paymentNote(status, "card"),
    crmReference: order.number,
    email: order.customer?.email ?? "",
    phone: order.customer?.phone ?? "",
    city: order.shippingAddress?.city ?? "",
    destination: order.shippingAddress?.line1 ?? "",
    // A recovered link cannot authorize clearing a basket from another session.
    cartFingerprint: "",
  };
}
