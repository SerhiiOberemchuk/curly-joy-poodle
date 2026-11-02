import { z } from "zod";
import { readString } from "@/lib/form";
import type { CustomerDetails, DeliveryDetails, PaymentMethod } from "./types";

export const FIELD_LIMITS = {
  firstName: 60,
  lastName: 60,
  email: 120,
  city: 120,
  destination: 200,
  comment: 500,
} as const;

/** What the phone field starts with: every number the shop serves is Ukrainian. */
export const PHONE_PREFIX = "+38 ";

/**
 * Formats the phone field while it is typed: a fixed +38, then the local
 * number «0XX XXX XX XX». Digits beyond the ten local ones are dropped and a
 * local number always starts with 0, so the field cannot hold a number of the
 * wrong length. `normalizePhone` still validates the result on submit and on
 * the server.
 */
export function formatPhoneInput(raw: string): string {
  // Deleting into the prefix keeps it: the field clears itself on blur.
  if (PHONE_PREFIX.startsWith(raw)) return PHONE_PREFIX;
  const typed = raw.startsWith(PHONE_PREFIX) ? raw.slice(PHONE_PREFIX.length) : raw;
  let local = typed.replace(/\D/g, "");
  if (local.startsWith("380")) local = local.slice(2);
  // The country code typed again out of habit: wait for its 0.
  else if (local === "3" || local === "38") return PHONE_PREFIX + local;
  if (local && !local.startsWith("0")) local = `0${local}`;
  local = local.slice(0, 10);
  const groups = [local.slice(0, 3), local.slice(3, 6), local.slice(6, 8), local.slice(8, 10)];
  return PHONE_PREFIX + groups.filter(Boolean).join(" ");
}

export function normalizePhone(raw: string): string | null {
  if (!/^[+\d\s()-]+$/.test(raw)) return null;
  const digits = raw.replace(/\D/g, "");
  const national =
    digits.length === 12 && digits.startsWith("380")
      ? digits.slice(3)
      : digits.length === 10 && digits.startsWith("0")
        ? digits.slice(1)
        : digits.length === 9
          ? digits
          : null;
  // A Ukrainian number is +380 and nine digits that never start with 0:
  // «067 440 439» is a mistyped mobile number, not +380067440439.
  return national && /^[1-9]\d{8}$/.test(national) ? `+380${national}` : null;
}

export const carrierRefSchema = z.uuid({ error: "Оберіть значення зі списку" });
const searchSchema = z.string().trim().max(120);
/** Branch number or part of the address; empty lists the city's first points. */
export const warehouseSearchSchema = z.string().trim().max(100);
const optionalRefSchema = z.union([carrierRefSchema, z.literal("")]);

export const checkoutSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, "Вкажіть ім’я")
      .max(FIELD_LIMITS.firstName),
    lastName: z
      .string()
      .trim()
      .min(2, "Вкажіть прізвище")
      .max(FIELD_LIMITS.lastName),
    phone: z
      .string()
      .trim()
      .refine(
        (value) => normalizePhone(value) !== null,
        "Вкажіть номер у форматі +380 XX XXX XX XX",
      )
      .transform((value) => normalizePhone(value) ?? value),
    email: z
      .string()
      .trim()
      .pipe(z.email("Вкажіть коректний email").max(FIELD_LIMITS.email)),
    city: z.string().max(FIELD_LIMITS.city),
    cityRef: carrierRefSchema,
    citySearch: searchSchema.min(2, "Оберіть населений пункт зі списку"),
    destination: z.string().max(FIELD_LIMITS.destination),
    branchRef: optionalRefSchema,
    branchSearch: warehouseSearchSchema,
    streetRef: optionalRefSchema,
    streetSearch: searchSchema,
    building: z.string().trim().max(11),
    flat: z.string().trim().max(35),
    comment: z
      .string()
      .trim()
      .max(FIELD_LIMITS.comment, "Не більше 500 символів"),
    delivery: z.enum(["np-branch", "np-courier"]),
    payment: z.enum(["card", "cod"]),
  })
  .superRefine((input, context) => {
    if (input.delivery === "np-branch" && !input.branchRef) {
      context.addIssue({
        code: "custom",
        path: ["branchRef"],
        message: "Оберіть відділення або поштомат зі списку",
      });
    }
    if (input.delivery === "np-courier") {
      if (!input.streetRef || input.streetSearch.length < 2) {
        context.addIssue({
          code: "custom",
          path: ["streetRef"],
          message: "Оберіть вулицю зі списку",
        });
      }
      if (!/^\d[\dА-Яа-яІіЇїЄєҐґA-Za-z/ -]{0,10}$/.test(input.building)) {
        context.addIssue({
          code: "custom",
          path: ["building"],
          message: "Вкажіть номер будинку",
        });
      }
    }
  });

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
export type CheckoutField = keyof CheckoutFormValues;
export type FieldErrors = Partial<Record<CheckoutField, string>>;
export interface CheckoutInput {
  customer: CustomerDetails;
  delivery: DeliveryDetails;
  payment: PaymentMethod;
}

export function validateCheckout(
  formData: FormData,
): { ok: true; value: CheckoutInput } | { ok: false; errors: FieldErrors } {
  const raw = Object.fromEntries(
    Object.keys(checkoutSchema.shape).map((key) => [
      key,
      readString(formData, key),
    ]),
  );
  const result = checkoutSchema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false,
      errors: Object.fromEntries(
        result.error.issues.map((issue) => [issue.path[0], issue.message]),
      ),
    };
  }

  const { firstName, lastName, email, phone, delivery, payment, ...address } =
    result.data;
  return {
    ok: true,
    value: {
      customer: { firstName, lastName, email, phone },
      delivery: { ...address, method: delivery },
      payment,
    },
  };
}
