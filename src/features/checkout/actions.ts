"use server";

import { redirect } from "next/navigation";

import { writeCartCookie } from "@/features/cart/cart-cookie";
import { getCart } from "@/features/cart/queries";

import type { CheckoutActionState } from "./action-state";
import { generateOrderNumber, saveOrder } from "./order-repository";
import { paymentProvider } from "./payment";
import { writeReceiptCookie } from "./receipt-cookie";
import type { Order } from "./types";
import { validateCheckout } from "./validation";

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

  const order: Order = {
    number: generateOrderNumber(),
    createdAt: new Date().toISOString(),
    customer: parsed.value.customer,
    delivery: parsed.value.delivery,
    payment: parsed.value.payment,
    items: cart.lines.map((line) => ({
      sku: line.sku,
      productId: line.productId,
      title: `${line.title}${line.line ? ` ${line.line}` : ""}`,
      size: line.size,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
    })),
    subtotal: cart.subtotal,
    freeShipping: cart.freeShipping,
  };

  await saveOrder(order);
  const intent = await paymentProvider.createPayment(order);

  await writeReceiptCookie({
    number: order.number,
    total: order.subtotal,
    payment: order.payment,
    note: intent.note,
    email: order.customer.email,
    phone: order.customer.phone,
    city: order.delivery.city,
    destination: order.delivery.destination,
  });

  // The order is recorded, so the cart has done its job.
  await writeCartCookie([]);

  // `redirect` throws to unwind — it must stay outside any try/catch above.
  redirect(intent.redirectUrl ?? "/checkout/success");
}
