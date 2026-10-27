import "server-only";
import { z } from "zod";

import { readCartCookie, writeCartCookie } from "@/features/cart/cart-cookie";
import { loadCart, matchesStored } from "@/features/cart/queries";
import type { Cart, StoredCartLine } from "@/features/cart/types";
import type { CheckoutActionState } from "./action-state";
import { parseSubmittedAttribution, type CrmAttribution } from "@/lib/attribution";
import {
  marketingConsentEnabled,
  marketingConsentPayload,
  type CrmMarketingConsent,
} from "./marketing-consent";
import { readString } from "@/lib/form";
import { formatMoney } from "@/lib/money";
import { CrmApiError } from "@/lib/crm-client";
import {
  promotionCartKey,
  promotionCodeSchema,
  isPromotionRefusal,
  promotionErrorMessage,
} from "./promotions";
import {
  cartFingerprint,
  checkoutAttempt,
  readCheckoutToken,
} from "./checkout-attempt";
import {
  createCrmOrder,
  getNpCities,
  getNpStreets,
  getNpWarehouses,
  getOrCreatePaymentLink,
  orderPayload,
} from "./crm";
import type { CrmCapabilities } from "./crm/types";
import {
  availableDeliveries,
  availablePayments,
  hryvniaCartTerms,
  sellsInHryvnia,
} from "./options";
import { settleCheckoutReturn } from "./payment/settlement";
import { awaitsCardPayment, paymentNote } from "./payment/status";
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
  | `/checkout/success?${string}`
  | `https://${string}`;

type CheckoutResult =
  | { ok: true; redirectTo: CheckoutDestination }
  | {
      ok: false;
      state: CheckoutActionState;
      /** The form shows a cart or options the server no longer accepts; re-render it. */
      stale?: boolean;
    };

function failure(
  message: string,
  errors: FieldErrors = {},
): Extract<CheckoutResult, { ok: false }> {
  return { ok: false, state: { status: "error", message, errors } };
}

/**
 * The confirmation page. `paymentUnavailable` says the bank could not be opened
 * on this attempt — the page reads everything else from the CRM. A return
 * token is carried along, so a recovered order stays open after a retry.
 */
function confirmationPage({
  token,
  paymentUnavailable = false,
}: {
  token?: string;
  paymentUnavailable?: boolean;
}): CheckoutDestination {
  const query = new URLSearchParams();
  if (token) query.set("token", token);
  if (paymentUnavailable) query.set("payment", "unavailable");
  const search = query.toString();
  return search ? `/checkout/success?${search}` : "/checkout/success";
}

function unavailableMethod(
  input: CheckoutInput,
  capabilities: CrmCapabilities,
): string | null {
  if (!sellsInHryvnia(capabilities)) {
    return "Оформлення в цій валюті зараз недоступне.";
  }
  if (
    !availablePayments(capabilities).some(
      (option) => option.value === input.payment,
    )
  ) {
    return "Обраний спосіб оплати зараз недоступний. Оберіть інший.";
  }
  if (
    !availableDeliveries(capabilities).some(
      (option) => option.value === input.delivery.method,
    )
  ) {
    return "Обраний спосіб доставки зараз недоступний. Оберіть інший.";
  }
  return null;
}

type DeliveryResult =
  { ok: true; delivery: DeliveryDetails } | { ok: false; errors: FieldErrors };

/**
 * Resolve submitted carrier refs against CRM. Each ref must be among the
 * results of the search that offered it to the buyer; browser-supplied labels
 * are never persisted.
 */
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
  if (delivery.method === "np-courier" && city.courierAvailable === false) {
    return {
      ok: false,
      errors: {
        cityRef:
          "Нова пошта не доставляє кур’єром у цей населений пункт. Оберіть відділення або поштомат.",
      },
    };
  }

  if (delivery.method === "np-branch") {
    const warehouses = await getNpWarehouses(city.ref, delivery.branchSearch);
    const branch = warehouses.items.find(
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
    delivery: {
      ...delivery,
      city: city.label,
      destination,
      branchRef: "",
      branchSearch: "",
    },
  };
}

function snapshotOrder(input: CheckoutInput, cart: Cart): Order {
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
    // The same rule the buyer saw in the cart summary.
    freeShipping: cart.freeShipping,
  };
}

async function submitOrder(
  order: Order,
  stored: readonly StoredCartLine[],
  nonce: string,
  attribution?: CrmAttribution,
  marketingConsent?: CrmMarketingConsent,
): Promise<OrderReceipt> {
  order.number = checkoutAttempt(orderPayload(order), nonce);
  const created = await createCrmOrder(order, attribution, marketingConsent);
  const status = order.payment === "cod" ? "not-required" : "unpaid";
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
  if (stored.length === 0) {
    return failure("Кошик порожній — додайте товари перед оформленням.");
  }
  let cart: Cart;
  let capabilities: CrmCapabilities;
  try {
    ({ cart, capabilities } = await loadCart(stored));
  } catch {
    return failure(
      "Не вдалося перевірити наявність товарів. Спробуйте ще раз.",
    );
  }

  const quantitiesChanged = !matchesStored(stored, cart);
  // The checkout page shows the cart already fitted to stock, with a notice.
  // When the form was rendered from exactly this cart, the buyer saw it: store
  // it and go on instead of asking for a second submit.
  const seenByBuyer =
    readString(formData, "cartKey") === promotionCartKey(cart.lines);
  const fitted: StoredCartLine[] = quantitiesChanged
    ? cart.lines.map((line) => ({ p: line.variantId, q: line.quantity }))
    : stored;
  if (quantitiesChanged) await writeCartCookie(fitted);
  if (quantitiesChanged && !seenByBuyer) {
    return {
      ...failure(
        "Наявність товарів змінилася. Кошик оновлено — перевірте кількість перед оформленням.",
      ),
      stale: true,
    };
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
      stale: true,
    };
  }

  const parsed = validateCheckout(formData);
  if (!parsed.ok) {
    return failure("Перевірте виділені поля.", parsed.errors);
  }

  const nonce = await readCheckoutToken(readString(formData, "checkoutToken"));
  if (!nonce) {
    const expired = failure(
      "Сесія оформлення застаріла. Перевірте оновлену форму та повторіть оформлення.",
    );
    return { ...expired, state: { ...expired.state, tokenRejected: true }, stale: true };
  }

  const unavailable = unavailableMethod(parsed.value, capabilities);
  if (unavailable) return { ...failure(unavailable), stale: true };
  const { minOrderAmount } = hryvniaCartTerms(capabilities);
  if (minOrderAmount !== null && cart.subtotal < minOrderAmount) {
    return failure(
      `Мінімальна сума замовлення — ${formatMoney(minOrderAmount)}.`,
    );
  }

  let receipt: OrderReceipt;
  try {
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
    );
    const rawCode = readString(formData, "promotionCode").trim();
    if (rawCode) {
      if (
        readString(formData, "promotionCartKey") !==
        promotionCartKey(cart.lines)
      )
        return {
          ...failure(
            "Кошик змінився — підсумок оновлено. Перевірте товари й застосуйте промокод ще раз.",
          ),
          stale: true,
        };
      const code = promotionCodeSchema.safeParse(rawCode);
      const expected = z.coerce
        .number()
        .int()
        .positive()
        .max(cart.subtotal)
        .safeParse(readString(formData, "promotionTotal") || "invalid");
      if (!code.success || !expected.success)
        return failure(
          "Застосуйте промокод і перевірте підсумок перед оформленням.",
        );
      // CRM validates this expectation atomically with creation, including replay.
      // A separate eligibility quote here would reject a retry of an accepted first order.
      order.promotion = {
        code: code.data,
        expectedTotal: (expected.data / 100).toFixed(2),
      };
      order.subtotal = expected.data;
    }
    receipt = await submitOrder(
      order,
      fitted,
      nonce,
      parseSubmittedAttribution(readString(formData, "attribution")),
      marketingConsentPayload(
        readString(formData, "marketingConsent") === "1",
        marketingConsentEnabled(),
      ),
    );
  } catch (error) {
    if (error instanceof CrmApiError && isPromotionRefusal(error))
      return failure(promotionErrorMessage(error.reason, error.details));
    return failure(
      "Не вдалося передати замовлення. Спробуйте ще раз — повторне надсилання не створить дубль.",
    );
  }

  // A provider failure after acceptance must never invite the buyer to place the order again.
  try {
    const current = await settleCheckoutReturn();
    if (current?.payment === "card" && awaitsCardPayment(current.status)) {
      return {
        ok: true,
        redirectTo: await getOrCreatePaymentLink(current.number),
      };
    }
  } catch {
    return {
      ok: true,
      redirectTo: confirmationPage({
        paymentUnavailable: receipt.payment === "card",
      }),
    };
  }
  return { ok: true, redirectTo: confirmationPage({}) };
}

export async function retryCheckoutPayment(
  token?: string,
): Promise<CheckoutDestination> {
  let receipt: OrderReceipt | null = null;
  try {
    receipt = await readPaymentReceipt(token);
    if (!receipt || receipt.payment !== "card") return "/checkout";
    const current = await settleCheckoutReturn(token);
    if (current && awaitsCardPayment(current.status)) {
      return await getOrCreatePaymentLink(current.number);
    }
  } catch {
    return confirmationPage({ token, paymentUnavailable: receipt !== null });
  }
  return confirmationPage({ token });
}
