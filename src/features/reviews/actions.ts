"use server";

import { z } from "zod";
import { getListedProducts } from "@/features/catalog/queries";
import { readString } from "@/lib/form";
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

/** Validates a preview only. No email, review or rating is persisted or published. */
export async function previewReviewAction(
  productId: string,
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
  try {
    if (
      !(await getListedProducts()).some((product) => product.id === productId)
    ) {
      return {
        status: "error",
        message: "Товар більше недоступний. Оновіть сторінку.",
        errors: {},
        values,
      };
    }
  } catch {
    return {
      status: "error",
      message: "Не вдалося перевірити товар. Спробуйте ще раз трохи пізніше.",
      errors: {},
      values,
    };
  }
  return {
    status: "preview",
    message:
      "Ось як виглядатиме ваш відгук. Він ще не опублікований і не збережений.",
    errors: {},
    values,
    preview: {
      author: parsed.data.name,
      rating: parsed.data.rating,
      text: parsed.data.comment,
    },
  };
}
