import "server-only";
import { getCrmOrder } from "../crm";
import { readReceiptCookie } from "../receipt-cookie";
import type { OrderReceipt } from "../types";
import { readPaymentReturnProof } from "./return-token";
import { crmPaymentStatus, paymentNote } from "./status";

/** A return proof identifies one order; another browser session cannot override it. */
export async function readPaymentReceipt(
  token?: string,
): Promise<OrderReceipt | null> {
  const proof = token ? await readPaymentReturnProof(token) : null;
  if (token && !proof) return null;
  const number = proof?.number;
  const saved = await readReceiptCookie();
  if (!number || saved?.number === number) return saved;
  const order = await getCrmOrder(number);
  if (order.externalId !== number || order.currency !== "UAH")
    throw new Error("Invalid CRM order.");
  const payment = proof.payment;
  const status = crmPaymentStatus(order, payment);
  return {
    number,
    total: Math.round(Number(order.totalAmount) * 100),
    payment,
    status,
    note: paymentNote(status, payment),
    crmReference: order.number,
    email: order.customer?.email ?? "",
    phone: order.customer?.phone ?? "",
    city: order.shippingAddress?.city ?? "",
    destination: order.shippingAddress?.line1 ?? "",
    cartRevision: proof.cartRevision,
  };
}
