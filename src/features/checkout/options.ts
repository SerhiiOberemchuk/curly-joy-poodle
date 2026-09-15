import type { DeliveryMethod, PaymentMethod } from "./types";

export const deliveryOptions: ReadonlyArray<{
  value: DeliveryMethod;
  label: string;
  hint: string;
  destinationLabel: string;
  destinationPlaceholder: string;
}> = [
  {
    value: "np-branch",
    label: "Відділення Нової Пошти",
    hint: "1–3 дні · за тарифами перевізника",
    destinationLabel: "Номер відділення",
    destinationPlaceholder: "Наприклад, 25",
  },
  {
    value: "np-locker",
    label: "Поштомат Нової Пошти",
    hint: "1–3 дні · до 20 кг",
    destinationLabel: "Номер поштомату",
    destinationPlaceholder: "Наприклад, 41234",
  },
  {
    value: "np-courier",
    label: "Кур’єр Нової Пошти",
    hint: "1–3 дні · доставка за адресою",
    destinationLabel: "Адреса доставки",
    destinationPlaceholder: "Вулиця, будинок, квартира",
  },
];

export const paymentOptions: ReadonlyArray<{
  value: PaymentMethod;
  label: string;
  hint: string;
}> = [
  {
    value: "card",
    label: "Карткою онлайн",
    hint: "Visa / Mastercard. Посилання на оплату надійде одразу після оформлення.",
  },
  {
    value: "cod",
    label: "Накладений платіж",
    hint: "Оплата при отриманні. Комісія перевізника — за тарифами Нової Пошти.",
  },
  {
    value: "invoice",
    label: "Рахунок для ФОП / ТОВ",
    hint: "Виставимо рахунок з ПДВ протягом робочого дня.",
  },
];

export function isDeliveryMethod(value: string): value is DeliveryMethod {
  return deliveryOptions.some((option) => option.value === value);
}

export function isPaymentMethod(value: string): value is PaymentMethod {
  return paymentOptions.some((option) => option.value === value);
}

export function deliveryLabel(method: DeliveryMethod): string {
  return deliveryOptions.find((option) => option.value === method)?.label ?? method;
}

export function paymentLabel(method: PaymentMethod): string {
  return paymentOptions.find((option) => option.value === method)?.label ?? method;
}
