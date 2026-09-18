import "server-only";

import { writeCartCookie } from "@/features/cart/cart-cookie";

import { findOrder } from "../order-repository";
import { readReceiptCookie, writeReceiptCookie } from "../receipt-cookie";
import type { Order, PaymentStatus } from "../types";
import { clearLiqPayCheckoutCookie } from "./checkout-cookie";
import { LIQPAY_FAILED_NOTE, LIQPAY_PAID_NOTE, LIQPAY_PENDING_NOTE } from "./liqpay";

export function cardPaymentNote(status: PaymentStatus): string {
  if (status === "paid") return LIQPAY_PAID_NOTE;
  if (status === "failed") return LIQPAY_FAILED_NOTE;
  return LIQPAY_PENDING_NOTE;
}

/**
 * Brings the browser back in line with the order once the customer returns
 * from the acquirer: the cart is emptied only after the payment settles, and
 * the receipt note is rewritten to match the status the order actually has.
 *
 * Safe to run more than once — the customer may refresh the confirmation page
 * while LiqPay's server callback is still on its way.
 */
export async function settleCheckoutReturn(orderNumber?: string | null): Promise<Order | null> {
  const receipt = await readReceiptCookie();
  if (!receipt) return null;
  // A result URL for someone else's order must not touch this browser's state.
  if (orderNumber && receipt.number !== orderNumber) return null;

  const order = await findOrder(receipt.number);
  if (!order) return null;

  if (order.payment === "card") {
    const note = cardPaymentNote(order.paymentStatus);
    if (note !== receipt.note) await writeReceiptCookie({ ...receipt, note });
  }

  if (order.paymentStatus === "paid") await writeCartCookie([]);

  // The handover is spent once the acquirer has answered. Leaving it behind
  // would let /checkout/pay reopen a payment that is already settled.
  if (order.paymentStatus !== "pending") await clearLiqPayCheckoutCookie();

  return order;
}
