import type { DeliveryMethod, PaymentMethod } from "./types";

export interface DeliveryOption {
  value: DeliveryMethod;
  label: string;
  hint: string;
  destinationLabel: string;
  destinationPlaceholder: string;
  /** `number` expects a branch/locker number, `address` a street address. */
  destinationKind: "number" | "address";
}

export const deliveryOptions: ReadonlyArray<DeliveryOption> = [
  {
    value: "np-branch",
    label: "Відділення Нової Пошти",
    hint: "1–3 дні · за тарифами перевізника",
    destinationLabel: "Номер відділення",
    destinationPlaceholder: "Наприклад, 25",
    destinationKind: "number",
  },
  {
    value: "np-locker",
    label: "Поштомат Нової Пошти",
    hint: "1–3 дні · до 20 кг",
    destinationLabel: "Номер поштомату",
    destinationPlaceholder: "Наприклад, 41234",
    destinationKind: "number",
  },
  {
    value: "np-courier",
    label: "Кур’єр Нової Пошти",
    hint: "1–3 дні · доставка за адресою",
    destinationLabel: "Адреса доставки",
    destinationPlaceholder: "Вулиця, будинок, квартира",
    destinationKind: "address",
  },
];

export const paymentOptions: ReadonlyArray<{
  value: PaymentMethod;
  label: string;
  hint: string;
}> = [
  {
    value: "card",
    label: "Карткою онлайн через LiqPay",
    hint: "Visa / Mastercard, Apple Pay або Google Pay на захищеній сторінці LiqPay.",
  },
  {
    value: "cod",
    label: "Накладений платіж",
    hint: "Оплата при отриманні. Комісія перевізника — за тарифами Нової Пошти.",
  },
  {
    value: "invoice",
    label: "Оплата за рахунком",
    hint: "Рахунок від ФОП 3 групи, без ПДВ. Надішлемо на email протягом робочого дня.",
  },
];

export function isDeliveryMethod(value: string): value is DeliveryMethod {
  return deliveryOptions.some((option) => option.value === value);
}

export function isPaymentMethod(value: string): value is PaymentMethod {
  return paymentOptions.some((option) => option.value === value);
}

export function deliveryOption(method: DeliveryMethod): DeliveryOption {
  return deliveryOptions.find((option) => option.value === method) ?? deliveryOptions[0];
}

export function deliveryLabel(method: DeliveryMethod): string {
  return deliveryOption(method).label;
}

export function paymentLabel(method: PaymentMethod): string {
  return paymentOptions.find((option) => option.value === method)?.label ?? method;
}
