import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { crmRequest, CrmApiError } from "@/lib/crm-client";
import { readString } from "@/lib/form";
import type { WelcomeOffer, OfferState } from "./types";

/** A promotion is visible only once the merchant supplies its actual terms. */
export function getWelcomeOffer(): WelcomeOffer | null {
  const description = process.env.WELCOME_OFFER_DESCRIPTION?.trim();
  if (
    process.env.WELCOME_OFFER_ENABLED !== "true" ||
    !description ||
    !process.env.OBRIYM_CRM_API_KEY
  )
    return null;
  const title =
    process.env.WELCOME_OFFER_TITLE?.trim() ||
    "Маленький привіт для вас і вашого хвостика";
  return {
    id: createHash("sha256")
      .update(JSON.stringify([title, description]))
      .digest("hex")
      .slice(0, 16),
    title,
    description,
  };
}

const offerSchema = z
  .object({
    email: z.union(
      [z.email("Вкажіть коректний email.").max(120), z.literal("")],
      { error: "Вкажіть коректний email." },
    ),
    phone: z.union(
      [
        z
          .string()
          .regex(/^\+?[\d\s()-]{10,20}$/, "Вкажіть коректний номер телефону.")
          .refine(
            (value) => /^\+?\d{10,15}$/.test(value.replace(/[\s()-]/g, "")),
            "Вкажіть коректний номер телефону.",
          ),
        z.literal(""),
      ],
      { error: "Вкажіть коректний номер телефону." },
    ),
    consent: z.literal("on", {
      error: "Потрібна згода на зв’язок щодо пропозиції.",
    }),
  })
  .refine((value) => value.email || value.phone, {
    message: "Вкажіть email або телефон.",
    path: ["email"],
  });
const acceptedLead = z.object({ data: z.object({ id: z.string().min(1) }) });

/** CRM lead intake; never invents a coupon or changes cart prices. */
export async function submitOfferRequest(
  formData: FormData,
): Promise<OfferState> {
  const values = {
    email: readString(formData, "email"),
    phone: readString(formData, "phone"),
    consent: readString(formData, "consent"),
  };
  const offer = getWelcomeOffer();
  if (!offer)
    return {
      status: "error",
      message: "Ця пропозиція зараз недоступна.",
      errors: {},
      values,
    };
  const parsed = offerSchema.safeParse(values);
  if (readString(formData, "offerId") !== offer.id)
    return {
      status: "error",
      message: "Умови пропозиції змінилися. Оновіть сторінку.",
      errors: {},
      values,
    };
  if (!parsed.success)
    return {
      status: "error",
      message: "Перевірте виділені поля.",
      errors: Object.fromEntries(
        parsed.error.issues.map((issue) => [issue.path[0], issue.message]),
      ),
      values,
    };
  if (readString(formData, "website"))
    return {
      status: "error",
      message: "Не вдалося надіслати запит.",
      errors: {},
      values,
    };
  const request = parsed.data;
  const email = request.email.toLowerCase();
  const phone = request.phone.replace(/[\s()-]/g, "");
  const day = new Date().toISOString().slice(0, 10);
  const key = createHash("sha256")
    .update(JSON.stringify([offer.id, day, email, phone]))
    .digest("hex");
  try {
    acceptedLead.parse(
      await crmRequest("/leads", {
        externalId: `welcome-${key}`,
        name: "Запит на пропозицію Curly Joy",
        source: "website",
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
        notes: `Пропозиція: ${offer.title}\nУмови: ${offer.description}\nКлієнт погодився на зв’язок щодо цієї пропозиції.`,
      }),
    );
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof CrmApiError && error.status === 429
          ? "Забагато запитів. Спробуйте за кілька хвилин."
          : "Не вдалося надіслати запит. Спробуйте ще раз або зв’яжіться з нами.",
      errors: {},
      values,
    };
  }
  return {
    status: "sent",
    message: "Дякуємо! Ваш запит отримано. Зв’яжемося з вами щодо пропозиції.",
    errors: {},
  };
}
