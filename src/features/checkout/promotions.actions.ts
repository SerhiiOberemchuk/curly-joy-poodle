"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { readCartCookie } from "@/features/cart/cart-cookie";
import { loadCart } from "@/features/cart/queries";
import { CrmApiError, crmRequest } from "@/lib/crm-client";
import { visitorHeaders } from "@/lib/visitor";
import { orderItemsPayload } from "./crm";
import {
  promotionCartKey,
  isPromotionRefusal,
  promotionErrorMessage,
  promotionInputSchema,
  promotionQuoteSchema,
  type PromotionResult,
} from "./promotions";

export async function quotePromotionAction(
  input: unknown,
): Promise<PromotionResult> {
  const parsed = promotionInputSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      message: "Вкажіть коректний email у контактах та промокод із листа.",
    };
  try {
    const { cart } = await loadCart(await readCartCookie());
    if (cart.isEmpty)
      return { ok: false, message: "Додайте товари до кошика." };
    const cartKey = promotionCartKey(cart.lines);
    if (parsed.data.cartKey !== cartKey) {
      // The buyer must see the changed cart before a discount is quoted on it.
      refresh();
      return {
        ok: false,
        message:
          "Кошик або ціни змінилися — підсумок оновлено. Перевірте товари й застосуйте промокод ще раз.",
        cartKey,
      };
    }
    const { email, code, delivery } = parsed.data;
    const { data: quote } = z.object({ data: promotionQuoteSchema }).parse(
      await crmRequest(
        "/promotions/quote",
        {
          currency: "UAH",
          customer: { email },
          items: orderItemsPayload(cart.lines),
          delivery: {
            carrier: "nova_poshta",
            method: delivery === "np-courier" ? "courier" : "branch",
          },
          promotion: { code },
        },
        await visitorHeaders(),
      ),
    );
    const total = Math.round(Number(quote.totalAmount) * 100);
    const discount = Math.round(Number(quote.discountAmount) * 100);
    if (total === 0)
      return {
        ok: false,
        message:
          "Оформлення замовлення з нульовою сумою зараз недоступне. Зверніться до нас, щоб скористатися цією пропозицією.",
      };
    const allocated = quote.lineDiscountAmounts.reduce(
      (sum, amount) => sum + Math.round(Number(amount) * 100),
      0,
    );
    if (
      quote.code !== code ||
      quote.lineDiscountAmounts.length !== cart.lines.length ||
      total + discount !== cart.subtotal ||
      allocated !== discount ||
      (quote.shippingDecision.currency !== null &&
        quote.shippingDecision.currency !== "UAH")
    )
      throw new Error("Inconsistent promotion quote");
    return { ok: true, quote };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof CrmApiError && isPromotionRefusal(error)
          ? promotionErrorMessage(error.reason, error.details)
          : error instanceof CrmApiError && error.status === 429
            ? "Забагато спроб. Зачекайте хвилину й спробуйте ще раз."
            : "Перевірка промокоду тимчасово недоступна. Спробуйте ще раз або оформіть замовлення без нього.",
    };
  }
}
