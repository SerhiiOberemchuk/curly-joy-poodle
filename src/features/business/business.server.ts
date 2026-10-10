import "server-only";

import { CrmApiError, crmRequest } from "@/lib/crm-client";
import { readString } from "@/lib/form";
import type { B2bRequestState } from "./action-state";
import { b2bRequestSchema, type B2bRequestField } from "./validation";

const FIELDS = [
  "companyName",
  "contactName",
  "phone",
  "email",
  "businessType",
  "city",
  "website",
  "message",
  "requestId",
] as const satisfies readonly B2bRequestField[];

/**
 * A wholesale access request becomes a CRM lead filed under the workspace's
 * "partner" source, so the manager sees it apart from retail enquiries. The
 * manager then opens the partner cabinet for the company from the CRM.
 */
export async function submitB2bRequest(
  formData: FormData,
): Promise<B2bRequestState> {
  // Raw form input, validated on the next line; the record only echoes it back.
  const values = Object.fromEntries(
    FIELDS.map((name) => [name, readString(formData, name)]),
  ) as Record<B2bRequestField, string>;
  const parsed = b2bRequestSchema.safeParse(values);
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

  const request = parsed.data;
  const notes = [
    "Запит на оптовий (B2B) доступ із сайту.",
    request.businessType ? `Тип бізнесу: ${request.businessType}` : null,
    request.city ? `Місто: ${request.city}` : null,
    request.website ? `Сайт або соцмережі: ${request.website}` : null,
    request.message ? `Коментар: ${request.message}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await crmRequest("/leads", {
      externalId: `b2b-${request.requestId}`,
      name: request.contactName,
      companyName: request.companyName,
      email: request.email,
      phone: request.phone,
      notes,
      source: "partner",
    });
  } catch (caught) {
    return {
      status: "error",
      message:
        caught instanceof CrmApiError && caught.status === 429
          ? "Забагато запитів. Спробуйте за кілька хвилин."
          : "Не вдалося надіслати запит. Спробуйте ще раз або напишіть нам.",
      errors: {},
      values,
    };
  }

  return {
    status: "sent",
    message:
      "Дякуємо! Менеджер зв’яжеться з вами протягом робочого дня, узгодить умови й надішле на ваш email запрошення до кабінету партнера.",
    errors: {},
  };
}
