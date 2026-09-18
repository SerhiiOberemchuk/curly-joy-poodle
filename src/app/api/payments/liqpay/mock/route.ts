import { NextResponse } from "next/server";

import {
  findOrder,
  updateOrderPaymentStatus,
} from "@/features/checkout/order-repository";
import { readLiqPayCheckoutCookie } from "@/features/checkout/payment/checkout-cookie";
import { liqPayMode } from "@/features/checkout/payment/liqpay";
import { siteUrl } from "@/lib/origin";

/**
 * Stand-in for LiqPay's hosted page while `LIQPAY_MODE=mock`. It exists so the
 * whole flow — handover, pending confirmation, success and failure with a
 * retry — can be walked through locally without acquirer keys. In any other
 * mode the route does not exist.
 */
export async function POST(request: Request): Promise<Response> {
  if (liqPayMode() !== "mock") {
    return new Response("Not available outside mock mode", { status: 404 });
  }

  // The handover cookie is what makes this a continuation of a real checkout,
  // so the order number comes from it rather than from the posted form.
  const session = await readLiqPayCheckoutCookie();
  if (!session?.mock) {
    return NextResponse.redirect(siteUrl("/checkout"), 303);
  }

  const order = await findOrder(session.orderId);
  if (!order) return NextResponse.redirect(siteUrl("/checkout"), 303);

  const paid = (await request.formData().catch(() => null))?.get("outcome") === "success";

  await updateOrderPaymentStatus(order.number, {
    status: paid ? "paid" : "failed",
    reference: paid ? `mock-${order.number}` : null,
    failureReason: paid ? null : "Імітація відмови банку (LIQPAY_MODE=mock)",
  });

  return NextResponse.redirect(
    siteUrl(`/api/payments/liqpay/result?order=${encodeURIComponent(order.number)}`),
    303,
  );
}
