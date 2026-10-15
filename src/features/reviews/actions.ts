"use server";

import { z } from "zod";
import { getCurrentProducts } from "@/features/catalog/queries";
import { readString } from "@/lib/form";
import { submitReview } from "./crm-reviews";
import type { ReviewState } from "./action-state";

const reviewSchema = z.object({
  name: z
    .string()
    .min(2, "Вкажіть ім’я — щонайменше 2 символи.")
    .max(80, "Ім’я має бути коротшим за 80 символів."),
  email: z
    .email("Вкажіть коректний email.")
    .max(120, "Email має бути коротшим за 120 символів."),
  rating: z
    .string()
    .regex(/^[1-5]$/, "Оберіть оцінку від 1 до 5.")
    .transform(Number),
  comment: z
    .string()
    .min(10, "Розкажіть трохи більше — щонайменше 10 символів.")
    .max(2000, "Відгук має бути коротшим за 2000 символів."),
  consent: z.literal("on", {
    error: "Потрібна згода на обробку даних для відгуку.",
  }),
});

/** Sends a pending review to CRM; the request id remains stable across retries. */
export async function submitReviewAction(
  productId: string,
  requestId: string,
  _state: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const values = {
    name: readString(formData, "name"),
    email: readString(formData, "email"),
    rating: readString(formData, "rating"),
    comment: readString(formData, "comment"),
    consent: readString(formData, "consent"),
  };
  const parsed = reviewSchema.safeParse(values);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Перевірте виділені поля.",
      errors: Object.fromEntries(
        parsed.error.issues.map((issue) => [issue.path[0], issue.message]),
      ),
      values,
    };
  }
  if (!z.uuid().safeParse(requestId).success) {
    return { status: "error", message: "Оновіть сторінку й повторіть спробу.", errors: {}, values };
  }
  try {
    const product = (await getCurrentProducts()).find((item) => item.id === productId);
    if (!product) {
      return {
        status: "error",
        message: "Товар більше недоступний. Оновіть сторінку.",
        errors: {},
        values,
      };
    }
    await submitReview({
      productId: product.variants[0].id,
      rating: parsed.data.rating,
      authorName: parsed.data.name,
      authorEmail: parsed.data.email,
      body: parsed.data.comment,
      externalId: requestId,
    });
  } catch {
    return {
      status: "error",
      message: "Не вдалося надіслати відгук до CRM. Спробуйте ще раз трохи пізніше.",
      errors: {},
      values,
    };
  }
  return {
    status: "submitted",
    message: "Дякуємо! Відгук отримано й передано на модерацію.",
    errors: {},
  };
}
