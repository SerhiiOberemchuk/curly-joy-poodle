import "server-only";

import { writeCartCookie } from "@/features/cart/cart-cookie";

import { findOrder, updateOrderPaymentStatus } from "../order-repository";
import { readReceiptCookie, writeReceiptCookie } from "../receipt-cookie";
import type { OrderReceipt, PaymentStatus } from "../types";
import { clearLiqPayCheckoutCookie } from "./checkout-cookie";
import {
  LIQPAY_FAILED_NOTE,
  LIQPAY_PAID_NOTE,
  LIQPAY_PENDING_NOTE,
  requestLiqPayStatus,
  sendLiqPayReceipt,
} from "./liqpay";

export function cardPaymentNote(status: PaymentStatus): string {
  if (status === "paid") return LIQPAY_PAID_NOTE;
  if (status === "failed") return LIQPAY_FAILED_NOTE;
  return LIQPAY_PENDING_NOTE;
}

/**
 * Brings the browser back in line with the payment once the customer returns
 * from the acquirer: the cart is emptied only after the payment settles, and
 * the receipt is rewritten to match the status the payment actually has.
 *
 * Three sources, in order of authority: the order log, then LiqPay itself,
 * then what the receipt already said. The middle one matters because the
 * server callback can be slow, lost, or — while the order log is per-instance
 * rather than shared — arrive somewhere that cannot see the order at all.
 *
 * Safe to run repeatedly; the confirmation screen polls it.
 */
export async function settleCheckoutReturn(
  orderNumber?: string | null,
): Promise<OrderReceipt | null> {
  const receipt = await readReceiptCookie();
  if (!receipt) return null;
  // A result URL for someone else's order must not touch this browser's state.
  if (orderNumber && receipt.number !== orderNumber) return null;

  const order = await findOrder(receipt.number);
  let status = order?.paymentStatus ?? receipt.status;

  if (receipt.payment === "card" && status !== "paid") {
    const reported = await requestLiqPayStatus(receipt.number);

    // Trust it only when it describes this order, to the kopiyka.
    if (
      reported &&
      reported.orderId === receipt.number &&
      reported.currency === "UAH" &&
      reported.amount === receipt.total
    ) {
      status = reported.status;
      if (order) {
        await updateOrderPaymentStatus(order.number, {
          status: reported.status,
          reference: reported.reference,
          failureReason: reported.failureReason,
        });
      }
    } else if (reported) {
      console.error(
        `[liqpay] status for ${receipt.number} does not match the receipt: ` +
          `${reported.amount} ${reported.currency} vs ${receipt.total} UAH`,
      );
    }
  }

  // LiqPay emails the receipt itself, to the address typed at checkout. Sent
  // from here rather than from the callback because this is the only place
  // that reliably knows the email — the callback carries no cookies, and the
  // order log may not be reachable from the instance that receives it.
  let receiptEmailed = receipt.receiptEmailed === true;
  if (status === "paid" && !receiptEmailed && receipt.email) {
    receiptEmailed = await sendLiqPayReceipt(receipt.number, receipt.email);
  }

  const note = receipt.payment === "card" ? cardPaymentNote(status) : receipt.note;
  const settled: OrderReceipt = { ...receipt, status, note, receiptEmailed };
  if (
    settled.status !== receipt.status ||
    settled.note !== receipt.note ||
    settled.receiptEmailed !== receipt.receiptEmailed
  ) {
    await writeReceiptCookie(settled);
  }

  if (status === "paid") await writeCartCookie([]);

  // The handover is spent once the acquirer has answered. Leaving it behind
  // would let /checkout/pay reopen a payment that is already settled.
  if (status !== "pending") await clearLiqPayCheckoutCookie();

  return settled;
}
