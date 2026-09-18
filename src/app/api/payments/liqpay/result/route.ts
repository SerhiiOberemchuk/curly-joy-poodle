import { NextResponse } from "next/server";

import {
  findOrder,
  updateOrderPaymentStatus,
} from "@/features/checkout/order-repository";
import {
  callbackMatchesOrder,
  liqPayMode,
  parseLiqPayCallback,
} from "@/features/checkout/payment/liqpay";
import { settleCheckoutReturn } from "@/features/checkout/payment/settlement";
import { siteUrl } from "@/lib/origin";

/**
 * Where LiqPay sends the customer back to. Two hops on purpose:
 *
 * `POST` is the cross-site form submit from LiqPay. `SameSite=Lax` cookies are
 * not sent with it, so it can only touch the order log — it applies the signed
 * result and then bounces the browser to the `GET`.
 *
 * `GET` is a top-level navigation, so this browser's cookies are there: it
 * clears the cart and refreshes the receipt before the confirmation screen.
 */
export async function POST(request: Request): Promise<Response> {
  const orderId = new URL(request.url).searchParams.get("order");
  const formData = await request.formData().catch(() => null);
  const data = formData?.get("data");
  const signature = formData?.get("signature");

  if (typeof data === "string" && typeof signature === "string" && liqPayMode() !== "mock") {
    await applySignedResult(data, signature);
  }

  return NextResponse.redirect(
    siteUrl(
      orderId
        ? `/api/payments/liqpay/result?order=${encodeURIComponent(orderId)}`
        : "/api/payments/liqpay/result",
    ),
    // 303 so the browser follows with a GET and carries its cookies along.
    303,
  );
}

export async function GET(request: Request): Promise<Response> {
  const orderId = new URL(request.url).searchParams.get("order");
  await settleCheckoutReturn(orderId);

  return NextResponse.redirect(siteUrl("/checkout/success"), 303);
}

/**
 * The customer's return is not trusted on its own — but it is signed with the
 * same key as the server callback, so a verified payload is worth applying
 * immediately. It saves the customer from staring at "pending" when the
 * callback is slow, or cannot reach a development machine at all.
 */
async function applySignedResult(data: string, signature: string): Promise<void> {
  let parsed;
  try {
    parsed = parseLiqPayCallback(data, signature);
  } catch (error) {
    console.error("[liqpay] result could not be verified:", error);
    return;
  }
  if (!parsed.ok) return;

  const callback = parsed.value;
  const order = await findOrder(callback.orderId);
  if (!order || !callbackMatchesOrder(order, callback)) return;

  await updateOrderPaymentStatus(order.number, {
    status: callback.status,
    reference: callback.reference,
    failureReason: callback.failureReason,
  });
}
