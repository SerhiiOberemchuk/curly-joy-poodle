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

export function normalizePhone(raw: string): string | null {
  if (!/^[+\d\s()-]+$/.test(raw)) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("380")) return `+${digits}`;
  if (digits.length === 10 && digits.startsWith("0")) return `+38${digits}`;
  if (digits.length === 9) return `+380${digits}`;
  return null;
}

export const carrierRefSchema = z.uuid({ error: "Оберіть значення зі списку" });
const searchSchema = z.string().trim().max(120);
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
