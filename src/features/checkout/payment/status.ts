import type { CrmOrder } from "../crm/types";
import type { PaymentMethod, PaymentStatus } from "../types";

export function crmPaymentStatus(
  order: CrmOrder,
  method: PaymentMethod,
): PaymentStatus {
  if (order.status === "refunded") return "refunded";
  const payments = order.payments.filter((p) => p.currency === order.currency);
  const paid = payments.reduce((sum, p) => {
    if (p.status !== "paid" && p.status !== "partially_refunded") return sum;
    if (p.status === "partially_refunded" && p.refundedAmount === null)
      return sum;
    return (
      sum +
      Math.max(
        0,
        Math.round(Number(p.amount) * 100) -
          Math.round(Number(p.refundedAmount ?? 0) * 100),
      )
    );
  }, 0);
  const total = Math.round(Number(order.totalAmount) * 100);
  if (Number.isFinite(total) && total > 0 && paid >= total) return "paid";
  if (order.status === "cancelled") return "cancelled";
  const latest = [...payments].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  )[0];
  if (latest?.status === "refunded") return "refunded";
  if (latest?.status === "partially_refunded") return "partially-refunded";
  if (latest?.status === "pending" || latest?.status === "authorized")
    return "pending";
  if (latest?.status === "failed" || latest?.status === "cancelled")
    return "failed";
  return method === "cod" ? "not-required" : "pending";
}
export function paymentNote(
  status: PaymentStatus,
  method: PaymentMethod,
): string {
  if (status === "paid") return "Оплату підтверджено.";
  if (status === "refunded") return "У CRM зафіксовано повернення коштів.";
  if (status === "partially-refunded")
    return "У CRM зафіксовано часткове повернення коштів.";
  if (status === "cancelled") return "Замовлення скасовано.";
  if (status === "failed")
    return "Оплату не завершено. Можна спробувати оплатити ще раз.";
  return method === "cod"
    ? "Замовлення прийнято. Оплатіть його при отриманні."
    : "Очікуємо підтвердження оплати від банку.";
}
