"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { writeCartCookie } from "@/features/cart/cart-cookie";
import { getCart } from "@/features/cart/queries";

import type { CheckoutActionState } from "./action-state";
import { crmProvider } from "./crm";
import {
  findOrder,
  reserveOrderNumber,
  saveOrder,
  updateOrderPaymentStatus,
} from "./order-repository";
import { paymentProvider } from "./payment";
import {
  clearLiqPayCheckoutCookie,
  writeLiqPayCheckoutCookie,
} from "./payment/checkout-cookie";
import { createLiqPayCheckout, LIQPAY_PENDING_NOTE } from "./payment/liqpay";
import { settleCheckoutReturn } from "./payment/settlement";
import type { PaymentCheckout, PaymentIntent } from "./payment/types";
import { readReceiptCookie, writeReceiptCookie } from "./receipt-cookie";
import type { Order } from "./types";
import { validateCheckout } from "./validation";

const PAYMENT_SETUP_FAILED =
  "Не вдалося підготувати оплату карткою. Спробуйте ще раз або оберіть інший спосіб оплати.";

function reportPaymentFailure(scope: string, error: unknown): void {
  // Never log `data`/`signature` or the private key — only what went wrong.
  console.error(`[checkout] ${scope}:`, error instanceof Error ? error.message : error);
}

export async function placeOrderAction(
  _state: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  const cart = await getCart();
  if (cart.isEmpty) {
    return {
      status: "error",
      message: "Кошик порожній — додайте товари перед оформленням.",
      errors: {},
    };
  }

  const parsed = validateCheckout(formData);
  if (!parsed.ok) {
    return {
      status: "error",
      message: "Перевірте виділені поля.",
      errors: parsed.errors,
    };
  }

  const initialStatus = parsed.value.payment === "cod" ? "not-required" : "pending";
  const placedAt = new Date().toISOString();
  const order: Order = {
    number: await reserveOrderNumber(),
    createdAt: placedAt,
    customer: parsed.value.customer,
    delivery: parsed.value.delivery,
    payment: parsed.value.payment,
    paymentStatus: initialStatus,
    paymentDetails: {
      status: initialStatus,
      reference: null,
      failureReason: null,
      updatedAt: placedAt,
    },
    items: cart.lines.map((line) => ({
      sku: line.sku,
      productId: line.productId,
      title: `${line.title}${line.line ? ` ${line.line}` : ""}`,
      size: line.size,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
    })),
    crmReference: null,
    subtotal: cart.subtotal,
    freeShipping: cart.freeShipping,
  };

  await saveOrder(order);

  // A CRM that is down must not lose the customer their order: the hand-off is
  // recorded when it works and reported when it does not, and either way the
  // order is already saved and the customer continues to payment.
  const crm = crmProvider();
  if (crm) {
    try {
      const submission = await crm.createOrder(order);
      if (submission) {
        order.crmReference = submission.reference;
        await saveOrder(order);
      }
    } catch (error) {
      reportPaymentFailure(`CRM did not accept order ${order.number}`, error);
    }
  }

  // Missing or rejected acquirer credentials must surface as a form error, not
  // as a crash on a page where the customer has just typed in their address.
  let intent: PaymentIntent;
  try {
    intent = await paymentProvider.createPayment(order);
  } catch (error) {
    reportPaymentFailure("could not create the payment", error);
    return { status: "error", message: PAYMENT_SETUP_FAILED, errors: {} };
  }

  if (!intent.checkout) {
    // An offline method must not inherit a handover left by an earlier attempt.
    await clearLiqPayCheckoutCookie();
  } else {
    await writeLiqPayCheckoutCookie({
      orderId: order.number,
      amount: order.subtotal,
      mock: intent.checkout.mock,
      data: intent.checkout.data,
      signature: intent.checkout.signature,
    });
  }

  await writeReceiptCookie({
    number: order.number,
    total: order.subtotal,
    payment: order.payment,
    status: order.paymentStatus,
    crmReference: order.crmReference,
    note: intent.note,
    email: order.customer.email,
    phone: order.customer.phone,
    city: order.delivery.city,
    destination: order.delivery.destination,
  });

  // Keep the cart while the customer is away at LiqPay, so a failed payment
  // still leaves something to go back to. Offline methods are complete now.
  if (order.payment !== "card") {
    await writeCartCookie([]);
  }

  // `redirect` throws to unwind — it must stay outside any try/catch above.
  redirect(intent.redirectUrl ?? "/checkout/success");
}

/**
 * Re-reads the order behind the receipt cookie. The confirmation screen offers
 * it while a card payment is still in flight: LiqPay's server callback can land
 * a moment after the customer is back.
 */
export async function checkPaymentStatusAction(): Promise<void> {
  await settleCheckoutReturn();
  refresh();
}

/** Starts a fresh LiqPay session for an order whose payment did not go through. */
export async function retryPaymentAction(): Promise<void> {
  const receipt = await readReceiptCookie();
  if (!receipt) redirect("/checkout");

  const settled = await settleCheckoutReturn(receipt.number);
  if (!settled || settled.payment !== "card") redirect("/checkout");
  if (settled.status === "paid") redirect("/checkout/success");

  let checkout: PaymentCheckout;
  try {
    const logged = await findOrder(settled.number);
    checkout = createLiqPayCheckout({
      number: settled.number,
      subtotal: settled.total,
      items: logged?.items,
    });
  } catch (error) {
    reportPaymentFailure("could not restart the payment", error);
    await clearLiqPayCheckoutCookie();
    await writeReceiptCookie({ ...settled, note: PAYMENT_SETUP_FAILED });
    redirect("/checkout/success");
  }

  // Back to square one for this attempt, so a stale failure is not shown again.
  await updateOrderPaymentStatus(settled.number, { status: "pending", failureReason: null });
  await writeReceiptCookie({ ...settled, status: "pending", note: LIQPAY_PENDING_NOTE });
  await writeLiqPayCheckoutCookie({
    orderId: settled.number,
    amount: settled.total,
    mock: checkout.mock,
    data: checkout.data,
    signature: checkout.signature,
  });

  redirect("/checkout/pay");
}
