import { readString } from "@/lib/form";

import { deliveryOption, isDeliveryMethod, isPaymentMethod } from "./options";
import type { CustomerDetails, DeliveryDetails, DeliveryMethod, PaymentMethod } from "./types";

export type FieldErrors = Partial<Record<CheckoutField, string>>;

export type CheckoutField =
  | "firstName"
  | "lastName"
  | "phone"
  | "email"
  | "city"
  | "destination"
  | "comment"
  | "delivery"
  | "payment";

export interface CheckoutInput {
  customer: CustomerDetails;
  delivery: DeliveryDetails;
  payment: PaymentMethod;
}

/**
 * Upper bounds shared with the form. They are generous for a human and tight
 * enough that a scripted submit cannot blow up the receipt cookie or the
 * `description` we sign for LiqPay.
 */
export const FIELD_LIMITS = {
  firstName: 60,
  lastName: 60,
  email: 120,
  city: 80,
  destination: 120,
  comment: 500,
} as const;

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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

/**
 * The destination field means different things per carrier option, so the rule
 * lives here and is used by both the form and the action.
 */
export function destinationError(method: DeliveryMethod, value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Вкажіть відділення або адресу";
  if (trimmed.length > FIELD_LIMITS.destination) {
    return `Не більше ${FIELD_LIMITS.destination} символів`;
  }

  if (deliveryOption(method).destinationKind === "number") {
    const digits = trimmed.replace(/\D/g, "");
    if (!digits || digits.length > 5) return "Вкажіть номер відділення, наприклад 25";
    return null;
  }

  if (trimmed.length < 6) return "Вкажіть вулицю, будинок і квартиру";
  return null;
}

function tooLong(value: string, limit: number): boolean {
  return value.length > limit;
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

  if (firstName.length < 2 || tooLong(firstName, FIELD_LIMITS.firstName)) {
    errors.firstName = "Вкажіть ім’я";
  }
  if (lastName.length < 2 || tooLong(lastName, FIELD_LIMITS.lastName)) {
    errors.lastName = "Вкажіть прізвище";
  }
  if (!phone) errors.phone = "Вкажіть номер у форматі +380 XX XXX XX XX";
  if (!EMAIL_PATTERN.test(email) || tooLong(email, FIELD_LIMITS.email)) {
    errors.email = "Вкажіть коректний email";
  }
  if (city.length < 2 || tooLong(city, FIELD_LIMITS.city)) {
    errors.city = "Вкажіть населений пункт";
  }
  if (tooLong(comment, FIELD_LIMITS.comment)) {
    errors.comment = `Не більше ${FIELD_LIMITS.comment} символів`;
  }
  if (!isDeliveryMethod(deliveryMethod)) errors.delivery = "Оберіть спосіб доставки";
  if (!isPaymentMethod(paymentMethod)) errors.payment = "Оберіть спосіб оплати";

  // Only meaningful once the carrier option is known.
  if (isDeliveryMethod(deliveryMethod)) {
    const destinationProblem = destinationError(deliveryMethod, destination);
    if (destinationProblem) errors.destination = destinationProblem;
  } else if (!destination) {
    errors.destination = "Вкажіть відділення або адресу";
  }

  if (
    Object.keys(errors).length > 0 ||
    !phone ||
    !isDeliveryMethod(deliveryMethod) ||
    !isPaymentMethod(paymentMethod)
  ) {
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
