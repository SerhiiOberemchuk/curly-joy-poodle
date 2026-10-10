import "server-only";
import { z } from "zod";

import { readCartCookie, writeCartCookie } from "@/features/cart/cart-cookie";
import { buildCart } from "@/features/cart/queries";
import type { Cart, StoredCartLine } from "@/features/cart/types";
import type { CheckoutActionState } from "./action-state";
import { readString } from "@/lib/form";
import {
  cartFingerprint,
  checkoutAttempt,
  readCheckoutToken,
} from "./checkout-attempt";
import {
  createCrmOrder,
  getCapabilities,
  getNpCities,
  getNpStreets,
  getNpWarehouses,
  getOrCreatePaymentLink,
  orderPayload,
} from "./crm";
import type { CrmCapabilities } from "./crm/types";
import { availableDeliveries, availablePayments } from "./options";
import { settleCheckoutReturn } from "./payment/settlement";
import { paymentNote } from "./payment/status";
import { writeReceiptCookie } from "./receipt-cookie";
import { readPaymentReceipt } from "./payment/return-receipt";
import type { DeliveryDetails, Order, OrderReceipt } from "./types";
import {
  validateCheckout,
  type CheckoutInput,
  type FieldErrors,
} from "./validation";

type CheckoutDestination =
  | "/checkout"
  | "/checkout/success"
  | `https://${string}`;

type CheckoutResult =
  | { ok: true; redirectTo: CheckoutDestination }
  | { ok: false; state: CheckoutActionState; cartChanged?: boolean };

export const PAYMENT_SETUP_FAILED =
  "Замовлення збережено. Не вдалося відкрити оплату. Натисніть «Перейти до оплати», щоб повторити.";

function failure(
  message: string,
  errors: FieldErrors = {},
): Extract<CheckoutResult, { ok: false }> {
  return { ok: false, state: { status: "error", message, errors } };
}

function unavailableMethod(
  input: CheckoutInput,
  capabilities: CrmCapabilities,
): string | null {
  if (capabilities.cart.currency !== "UAH") {
    return "Оформлення в цій валюті зараз недоступне.";
  }
  if (
    !availablePayments(capabilities).some(
      (option) => option.value === input.payment,
    )
  ) {
    return "Обраний спосіб оплати зараз недоступний. Оновіть сторінку.";
  }
  if (
    !availableDeliveries(capabilities).some(
      (option) => option.value === input.delivery.method,
    )
  ) {
    return "Обраний спосіб доставки зараз недоступний. Оновіть сторінку.";
  }
  return null;
}

type DeliveryResult =
  | { ok: true; delivery: DeliveryDetails }
  | { ok: false; errors: FieldErrors };

/** Resolve submitted carrier refs against CRM. Browser-supplied labels are never persisted. */
async function resolveDelivery(
  delivery: DeliveryDetails,
): Promise<DeliveryResult> {
  const cities = await getNpCities(delivery.citySearch);
  const city = cities.find((option) => option.ref === delivery.cityRef);
  if (!city) {
    return {
      ok: false,
      errors: { cityRef: "Оберіть населений пункт зі списку" },
    };
  }

  if (delivery.method === "np-branch") {
    const warehouses = await getNpWarehouses(city.ref);
    const branch = warehouses.find(
      (option) => option.ref === delivery.branchRef,
    );
    if (!branch) {
      return {
        ok: false,
        errors: { branchRef: "Оберіть відділення або поштомат зі списку" },
      };
    }
    return {
      ok: true,
      delivery: {
        ...delivery,
        city: city.label,
        destination: branch.label,
        streetRef: "",
        streetSearch: "",
        building: "",
        flat: "",
      },
    };
  }

  const streets = await getNpStreets(city.ref, delivery.streetSearch);
  const street = streets.find((option) => option.ref === delivery.streetRef);
  if (!street) {
    return { ok: false, errors: { streetRef: "Оберіть вулицю зі списку" } };
  }
  const destination = `${street.label}, буд. ${delivery.building}${delivery.flat ? `, кв. ${delivery.flat}` : ""}`;
  return {
    ok: true,
    delivery: { ...delivery, city: city.label, destination, branchRef: "" },
  };
}

function snapshotOrder(
  input: CheckoutInput,
  cart: Cart,
  capabilities: CrmCapabilities,
): Order {
  const threshold = capabilities.cart.freeShippingThreshold;
  return {
    number: "",
    customer: input.customer,
    delivery: input.delivery,
    payment: input.payment,
    items: cart.lines.map((line) => ({
      sku: line.sku,
      productId: line.variantId,
      title: line.title,
      option: line.option,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
    })),
    subtotal: cart.subtotal,
    freeShipping:
      threshold !== null && cart.subtotal >= Math.round(threshold * 100),
  };
}

async function submitOrder(
  order: Order,
  stored: readonly StoredCartLine[],
  nonce: string,
): Promise<OrderReceipt> {
  order.number = await checkoutAttempt(orderPayload(order), nonce);
  const created = await createCrmOrder(order);
  const status = order.payment === "cod" ? "not-required" : "pending";
  const receipt: OrderReceipt = {
    number: order.number,
    total: order.subtotal,
    payment: order.payment,
    status,
    note: paymentNote(status, order.payment),
    email: order.customer.email,
    phone: order.customer.phone,
    city: order.delivery.city,
    destination: order.delivery.destination,
    crmReference: created.number ?? created.id,
    cartFingerprint: cartFingerprint(stored),
  };
  await writeReceiptCookie(receipt);
  return receipt;
}

/** External writes begin only after a fresh basket, capabilities and address have passed validation. */
export async function submitCheckout(
  formData: FormData,
): Promise<CheckoutResult> {
  const stored = await readCartCookie();
  let cart: Cart;
  try {
    cart = await buildCart(stored);
  } catch {
    return failure(
      "Не вдалося перевірити наявність товарів. Спробуйте ще раз.",
    );
  }

  const quantitiesChanged =
    stored.length !== cart.lines.length ||
    stored.some(
      (item) =>
        !cart.lines.some(
          (line) => line.variantId === item.p && line.quantity === item.q,
        ),
    );
  if (quantitiesChanged) {
    await writeCartCookie(
      cart.lines.map((line) => ({ p: line.variantId, q: line.quantity })),
    );
    return {
      ...failure(
        "Наявність товарів змінилася. Кошик оновлено — перевірте кількість перед оформленням.",
      ),
      cartChanged: true,
    };
  }
  if (cart.isEmpty) {
    return failure("Кошик порожній — додайте товари перед оформленням.");
  }

  const quotedTotal = z.coerce
    .number()
    .int()
    .positive()
    .safeParse(formData.get("expectedSubtotal"));
  if (!quotedTotal.success || quotedTotal.data !== cart.subtotal) {
    return {
      ...failure(
        "Сума замовлення змінилася або застаріла. Перевірте оновлений підсумок і підтвердьте оформлення ще раз.",
      ),
      cartChanged: true,
    };
  }

  const parsed = validateCheckout(formData);
  if (!parsed.ok) {
    return failure("Перевірте виділені поля.", parsed.errors);
  }

  const nonce = await readCheckoutToken(readString(formData, "checkoutToken"));
  if (!nonce)
    return {
      ...failure(
        "Сесія оформлення застаріла. Перевірте оновлену форму та повторіть оформлення.",
      ),
      cartChanged: true,
    };

  let receipt: OrderReceipt;
  try {
    const capabilities = await getCapabilities();
    const unavailable = unavailableMethod(parsed.value, capabilities);
    if (unavailable) return failure(unavailable);

    const minimum = capabilities.cart.minOrderAmount;
    if (minimum !== null && cart.subtotal < Math.round(minimum * 100)) {
      return failure(`Мінімальна сума замовлення — ${minimum} ₴.`);
    }

    const resolved = await resolveDelivery(parsed.value.delivery);
    if (!resolved.ok)
      return failure("Перевірте адресу доставки.", resolved.errors);
    if (
      resolved.delivery.city.length > 120 ||
      resolved.delivery.destination.length > 200
    ) {
      return failure(
        "Адреса перевищує допустиму довжину. Зверніться до нас для оформлення.",
      );
    }

    const order = snapshotOrder(
      { ...parsed.value, delivery: resolved.delivery },
      cart,
      capabilities,
    );
    receipt = await submitOrder(order, stored, nonce);
  } catch {
    return failure(
      "Не вдалося передати замовлення. Спробуйте ще раз — повторне надсилання не створить дубль.",
    );
  }

  // A provider failure after acceptance must never invite the buyer to place the order again.
  try {
    const current = await settleCheckoutReturn();
    if (
      current?.payment === "card" &&
      (current.status === "pending" || current.status === "failed")
    ) {
      return {
        ok: true,
        redirectTo: await getOrCreatePaymentLink(current.number),
      };
    }
  } catch {
    await writeReceiptCookie({ ...receipt, note: PAYMENT_SETUP_FAILED });
  }
  return { ok: true, redirectTo: "/checkout/success" };
}

export async function retryCheckoutPayment(
  token?: string,
): Promise<CheckoutDestination> {
  let receipt: OrderReceipt | null = null;
  try {
    receipt = await readPaymentReceipt(token);
    if (!receipt || receipt.payment !== "card") return "/checkout";
    const current = await settleCheckoutReturn(token);
    if (
      current &&
      (current.status === "pending" || current.status === "failed")
    ) {
      return await getOrCreatePaymentLink(current.number);
    }
  } catch {
    if (receipt)
      await writeReceiptCookie({ ...receipt, note: PAYMENT_SETUP_FAILED });
  }
  return "/checkout/success";
}
