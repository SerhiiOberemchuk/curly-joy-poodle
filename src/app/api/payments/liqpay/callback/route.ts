import {
  findOrder,
  updateOrderPaymentStatus,
} from "@/features/checkout/order-repository";
import {
  callbackMatchesOrder,
  liqPayMode,
  parseLiqPayCallback,
} from "@/features/checkout/payment/liqpay";

/**
 * LiqPay's server-to-server notification. It is the only source of truth for
 * whether the money moved: the customer's own return can be interrupted, faked
 * or simply never happen.
 *
 * LiqPay retries a callback until it gets a 2xx, so anything that might be
 * transient (an order not yet visible to this process) answers with 5xx/4xx
 * and anything permanent (a bad signature) answers without inviting a retry.
 */
export async function POST(request: Request): Promise<Response> {
  if (liqPayMode() === "mock") {
    return new Response("Not available in mock mode", { status: 404 });
  }

  const formData = await request.formData().catch(() => null);
  const data = formData?.get("data");
  const signature = formData?.get("signature");

  if (typeof data !== "string" || typeof signature !== "string") {
    return new Response("Missing LiqPay payload", { status: 400 });
  }

  let parsed;
  try {
    parsed = parseLiqPayCallback(data, signature);
  } catch (error) {
    // Only reached when the keys are missing; retrying after a fix is useful.
    console.error("[liqpay] callback could not be verified:", error);
    return new Response("Payment provider not configured", { status: 503 });
  }

  if (!parsed.ok) {
    return new Response(
      parsed.reason === "signature" ? "Invalid LiqPay signature" : "Invalid LiqPay payload",
      { status: parsed.reason === "signature" ? 401 : 400 },
    );
  }

  const callback = parsed.value;
  const order = await findOrder(callback.orderId);
  if (!order) return new Response("Order not found", { status: 404 });

  if (!callbackMatchesOrder(order, callback)) {
    console.error(
      `[liqpay] callback for ${order.number} does not match the order: ` +
        `${callback.amount} ${callback.currency} vs ${order.subtotal} UAH`,
    );
    return new Response("Payment does not match the order", { status: 409 });
  }

  await updateOrderPaymentStatus(order.number, {
    status: callback.status,
    reference: callback.reference,
    failureReason: callback.failureReason,
  });

  return new Response("ok");
}
