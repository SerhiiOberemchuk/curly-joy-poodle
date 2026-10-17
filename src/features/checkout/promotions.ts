import { z } from "zod";
import { moneySchema } from "./crm/types";

export const promotionCodeSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9][A-Za-z0-9_-]{2,63}$/)
  .transform((code) => code.toUpperCase());
export const promotionInputSchema = z.object({
  code: promotionCodeSchema,
  email: z.string().trim().toLowerCase().pipe(z.email().max(120)),
  delivery: z.enum(["np-branch", "np-courier"]),
  cartKey: z.string().max(100_000),
});
export type PromotionInput = z.infer<typeof promotionInputSchema>;

export const promotionQuoteSchema = z.object({
  currency: z.literal("UAH"),
  code: promotionCodeSchema,
  discountAmount: moneySchema,
  totalAmount: moneySchema,
  lineDiscountAmounts: z.array(moneySchema),
  reservesUse: z.literal(false),
  shippingDecision: z.object({
    state: z.enum([
      "not_applicable",
      "pending_delivery",
      "free",
      "not_free",
      "needs_amount",
      "pickup",
    ]),
    threshold: moneySchema.nullable(),
    evaluatedAmount: moneySchema.nullable(),
    currency: z.string().nullable(),
  }),
});
export type PromotionQuote = z.infer<typeof promotionQuoteSchema>;
export type PromotionResult =
  | { ok: true; quote: PromotionQuote }
  | {
      ok: false;
      message: string;
      /** Set when the cart changed: the refusal belongs to the refreshed cart. */
      cartKey?: string;
    };

export function promotionCartKey(
  lines: readonly { variantId: string; quantity: number; unitPrice: number }[],
): string {
  return JSON.stringify(
    lines.map((line) => [line.variantId, line.quantity, line.unitPrice]),
  );
}

export function promotionInputKey(
  input: { code: string; email: string; delivery: string },
  cartKey: string,
): string {
  return JSON.stringify([
    input.code.trim().toUpperCase(),
    input.email.trim().toLowerCase(),
    input.delivery,
    cartKey,
  ]);
}

function formatMinimum(details?: Record<string, unknown>): string | null {
  const amount = Number(details?.minimumAmount);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const currency = details?.currency;
  const symbol =
    currency === "UAH" || currency === undefined ? "₴" : String(currency);
  return `${amount.toLocaleString("uk-UA", { maximumFractionDigits: 2 })} ${symbol}`;
}

/** Maps the CRM's public refusal reasons to buyer-facing copy. */
export function promotionErrorMessage(
  reason?: string,
  details?: Record<string, unknown>,
): string {
  switch (reason) {
    case "price_changed":
      return "Сума зі знижкою змінилася. Застосуйте промокод ще раз і перевірте підсумок.";
    case "code_unavailable":
      return "Промокод зараз недоступний. Перевірте код і строк дії пропозиції.";
    case "email_mismatch":
      return "Цей промокод діє лише з email, на який його надіслано.";
    case "not_eligible":
      return "Промокод не підходить для цього замовлення.";
    case "usage_limit_reached":
      return "Ліміт використання цього промокоду вичерпано.";
    case "minimum_not_met": {
      const minimum = formatMinimum(details);
      return minimum
        ? `Мінімальна сума замовлення для цього промокоду — ${minimum}.`
        : "Сума відповідних товарів недостатня для цього промокоду.";
    }
    case "no_eligible_items":
      return "На товари в кошику цей промокод не діє (акційні товари не беруть участі).";
    case "currency_mismatch":
      return "Промокод не діє для валюти цього замовлення.";
    case "promotion_with_legacy_discount":
      return "Промокод не можна поєднати з іншою знижкою на замовлення.";
    default:
      return "Промокод не вдалося застосувати. Перевірте код, email та умови пропозиції.";
  }
}

/** HTTP 409 carries business refusals; 400 is a malformed request with a reason. */
export function isPromotionRefusal(error: {
  status: number;
  reason?: string;
}): boolean {
  return error.status === 409 || (error.status === 400 && !!error.reason);
}
