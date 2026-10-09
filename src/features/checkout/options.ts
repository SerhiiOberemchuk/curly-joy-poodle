import type { CrmCapabilities } from "./crm/types";
import type { DeliveryMethod, PaymentMethod } from "./types";

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
export function paymentLabel(method: PaymentMethod): string {
  return (
    paymentOptions.find((option) => option.value === method)?.label ?? method
  );
}
