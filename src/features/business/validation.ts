import { z } from "zod";

import { normalizePhone } from "@/features/checkout/validation";

export const BUSINESS_TYPES = [
  "Зоомагазин",
  "Грумінг-салон",
  "Ветеринарна клініка",
  "Розплідник або клуб",
  "Інтернет-магазин",
  "Інше",
] as const;

export const b2bRequestSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(2, "Вкажіть назву компанії або ФОП")
    .max(200),
  contactName: z
    .string()
    .trim()
    .min(2, "Вкажіть контактну особу")
    .max(120),
  phone: z
    .string()
    .trim()
    .refine(
      (value) => normalizePhone(value) !== null,
      "Вкажіть номер у форматі +380 XX XXX XX XX",
    )
    .transform((value) => normalizePhone(value) ?? value),
  // Required: the partner cabinet invitation is sent to this address.
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Вкажіть коректний email").max(120)),
  businessType: z.union([z.enum(BUSINESS_TYPES), z.literal("")]),
  city: z.string().trim().max(120),
  website: z.string().trim().max(200),
  message: z.string().trim().max(1000, "Не більше 1000 символів"),
  // Generated once per form in the browser: a double submit reaches the CRM
  // with the same key and returns the lead it already created.
  requestId: z.uuid(),
});
export type B2bRequestValues = z.input<typeof b2bRequestSchema>;
export type B2bRequestField = keyof B2bRequestValues;
