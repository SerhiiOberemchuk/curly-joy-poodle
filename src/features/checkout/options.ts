import type { CrmCapabilities } from "./crm/types";
import type { DeliveryMethod, PaymentMethod } from "./types";
import type { Cart } from "@/features/cart/types";

/** The delivery terms shown alongside the amount the buyer confirms. */
export function shippingTermsKey(
  cart: Pick<Cart, "freeShipping" | "freeShippingThreshold">,
): string {
  return JSON.stringify([cart.freeShipping, cart.freeShippingThreshold]);
}

export const deliveryOptions: ReadonlyArray<{
  value: DeliveryMethod;
  label: string;
  hint: string;
}> = [
  {
    value: "np-branch",
    label: "Відділення або поштомат Нової пошти",
    hint: "Оберіть пункт отримання зі списку Нової пошти.",
  },
  {
    value: "np-courier",
    label: "Кур’єр Нової пошти",
    hint: "Доставка за адресою.",
  },
];
export const paymentOptions: ReadonlyArray<{
  value: PaymentMethod;
  label: string;
  hint: string;
}> = [
  {
    value: "card",
    label: "Карткою онлайн через Monobank",
    hint: "Оплата на захищеній сторінці банку.",
  },
  {
    value: "cod",
    label: "Накладений платіж",
    hint: "Оплата при отриманні. Комісія — за тарифами перевізника.",
  },
];
export function isDeliveryMethod(value: string): value is DeliveryMethod {
  return deliveryOptions.some((option) => option.value === value);
}
export function isPaymentMethod(value: string): value is PaymentMethod {
  return paymentOptions.some((option) => option.value === value);
}
export function availablePayments(capabilities: CrmCapabilities) {
  return paymentOptions.filter((option) =>
    capabilities.payments.some(
      (p) =>
        p.status === "active" &&
        (option.value === "card"
          ? p.key === "monobank" && p.paymentLink === true
          : p.key === "cod"),
    ),
  );
}
export function availableDeliveries(capabilities: CrmCapabilities) {
  const carrier = capabilities.shipping.find(
    (s) => s.key === "nova_poshta" && s.status === "active",
  );
  return deliveryOptions.filter((option) =>
    carrier?.modes?.includes(
      option.value === "np-courier" ? "doors" : "warehouse",
    ),
  );
}
/**
 * The CRM's cart terms for hryvnia, in kopiyky; null where the CRM sets none.
 * The per-currency rule wins, and the top-level one applies only while it is
 * itself for UAH. The cart, its summary and the saved order all read these, so
 * a buyer is never shown free shipping the order then charges for.
 */
/**
 * The shop sells in hryvnias. A workspace kept in another currency still takes
 * these orders when it has hryvnia cart terms of its own.
 */
export function sellsInHryvnia(capabilities: CrmCapabilities): boolean {
  return (
    capabilities.cart.currency === "UAH" ||
    capabilities.cart.byCurrency.some((entry) => entry.currency === "UAH")
  );
}

export function hryvniaCartTerms(capabilities: CrmCapabilities): {
  freeShippingThreshold: number | null;
  minOrderAmount: number | null;
} {
  const rule =
    capabilities.cart.byCurrency.find((entry) => entry.currency === "UAH") ??
    (capabilities.cart.currency === "UAH" ? capabilities.cart : null);
  const kopiyky = (amount: number | null | undefined) =>
    amount === null || amount === undefined ? null : Math.round(amount * 100);
  return {
    freeShippingThreshold: kopiyky(rule?.freeShippingThreshold),
    minOrderAmount: kopiyky(rule?.minOrderAmount),
  };
}
export function paymentLabel(method: PaymentMethod): string {
  return (
    paymentOptions.find((option) => option.value === method)?.label ?? method
  );
}
