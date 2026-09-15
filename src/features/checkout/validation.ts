import { readString } from "@/lib/form";

import { isDeliveryMethod, isPaymentMethod } from "./options";
import type { CustomerDetails, DeliveryDetails, PaymentMethod } from "./types";

export type FieldErrors = Partial<Record<CheckoutField, string>>;

export type CheckoutField =
  | "firstName"
  | "lastName"
  | "phone"
  | "email"
  | "city"
  | "destination"
  | "delivery"
  | "payment";

export interface CheckoutInput {
  customer: CustomerDetails;
  delivery: DeliveryDetails;
  payment: PaymentMethod;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Accepts the shapes Ukrainian customers actually type — `+380…`, `380…`,
 * `0…`, with spaces, dashes or brackets — and normalises to `+380XXXXXXXXX`.
 * Returns `null` when the number cannot be a Ukrainian mobile.
 */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");

  const national =
    digits.length === 12 && digits.startsWith("380")
      ? digits.slice(2)
      : digits.length === 10 && digits.startsWith("0")
        ? digits
        : digits.length === 9
          ? `0${digits}`
          : null;

  if (!national) return null;
  return `+38${national}`;
}

export function validateCheckout(
  formData: FormData,
): { ok: true; value: CheckoutInput } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};

  const firstName = readString(formData, "firstName");
  const lastName = readString(formData, "lastName");
  const email = readString(formData, "email");
  const city = readString(formData, "city");
  const destination = readString(formData, "destination");
  const comment = readString(formData, "comment");
  const deliveryMethod = readString(formData, "delivery");
  const paymentMethod = readString(formData, "payment");
  const phone = normalizePhone(readString(formData, "phone"));

  if (firstName.length < 2) errors.firstName = "Вкажіть ім’я";
  if (lastName.length < 2) errors.lastName = "Вкажіть прізвище";
  if (!phone) errors.phone = "Вкажіть номер у форматі +380 XX XXX XX XX";
  if (!EMAIL_PATTERN.test(email)) errors.email = "Вкажіть коректний email";
  if (city.length < 2) errors.city = "Вкажіть населений пункт";
  if (destination.length < 1) errors.destination = "Вкажіть відділення або адресу";
  if (!isDeliveryMethod(deliveryMethod)) errors.delivery = "Оберіть спосіб доставки";
  if (!isPaymentMethod(paymentMethod)) errors.payment = "Оберіть спосіб оплати";

  if (Object.keys(errors).length > 0 || !phone) {
    return { ok: false, errors };
  }
  if (!isDeliveryMethod(deliveryMethod) || !isPaymentMethod(paymentMethod)) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      customer: { firstName, lastName, phone, email },
      delivery: { method: deliveryMethod, city, destination, comment },
      payment: paymentMethod,
    },
  };
}
