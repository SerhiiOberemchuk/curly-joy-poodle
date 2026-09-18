import type { Order } from "../types";
import type { PaymentIntent, PaymentProvider } from "./types";

/**
 * Placeholder acquirer. Card orders are confirmed by a manager who sends a
 * payment link manually; everything else is settled on delivery or by invoice.
 *
 * Swapping in LiqPay or Monobank Acquiring means implementing `PaymentProvider`
 * in a sibling module and changing the export in `./index` — nothing upstream
 * of `createPayment` needs to know which acquirer is live.
 */
export const manualPaymentProvider: PaymentProvider = {
  id: "manual",

  async createPayment(order: Order): Promise<PaymentIntent> {
    switch (order.payment) {
      case "card":
        return {
          redirectUrl: null,
          status: "pending",
          note: "Посилання на оплату карткою надішлемо на email та у Viber протягом 15 хвилин.",
        };
      case "cod":
        return {
          redirectUrl: null,
          status: "not-required",
          note: "Оплата при отриманні у відділенні. Комісія перевізника — за тарифами Нової Пошти.",
        };
      case "invoice":
        return {
          redirectUrl: null,
          status: "pending",
          note: "Рахунок від ФОП 3 групи без ПДВ надішлемо на email протягом робочого дня.",
        };
    }
  },
};
