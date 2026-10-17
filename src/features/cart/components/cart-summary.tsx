import type { ReactNode } from "react";

import { buttonStyles } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";

import type { Cart } from "../types";
import type { PromotionQuote } from "@/features/checkout/promotions";
import styles from "./cart-view.module.css";

export function CartSummary({
  cart,
  action,
  children,
  promotion,
}: {
  cart: Cart;
  action?: "checkout" | "none";
  /** Optional line-item breakdown rendered above the totals. */
  children?: ReactNode;
  promotion?: PromotionQuote;
}) {
  const total = promotion
    ? Math.round(Number(promotion.totalAmount) * 100)
    : cart.subtotal;
  const threshold = promotion
    ? promotion.shippingDecision.threshold === null
      ? null
      : Math.round(Number(promotion.shippingDecision.threshold) * 100)
    : cart.freeShippingThreshold;
  const freeShipping = promotion
    ? promotion.shippingDecision.state === "free"
    : cart.freeShipping;
  const remainder = threshold === null ? null : Math.max(0, threshold - total);
  const shippingPending =
    promotion &&
    !["free", "not_free", "pickup"].includes(promotion.shippingDecision.state);
  const progress = threshold
    ? Math.min(100, Math.round((total / threshold) * 100))
    : 0;

  return (
    <aside className={styles.summary} aria-label="Підсумок замовлення">
      <h2 className={styles.summaryTitle}>Разом</h2>

      {children}

      <p className={styles.summaryRow}>
        <span>Товари ({cart.itemCount} шт.)</span>
        <span>{formatMoney(cart.subtotal)}</span>
      </p>

      {cart.savings > 0 ? (
        <p className={styles.summaryRow}>
          <span>Вигода від акційних цін</span>
          <span className={styles.savings}>−{formatMoney(cart.savings)}</span>
        </p>
      ) : null}

      {promotion ? (
        <p className={styles.summaryRow}>
          <span>Промокод {promotion.code}</span>
          <span className={styles.savings}>
            −{formatMoney(Math.round(Number(promotion.discountAmount) * 100))}
          </span>
        </p>
      ) : null}

      <p className={styles.summaryRow}>
        <span>Доставка</span>
        <span>
          {shippingPending
            ? "Уточнюється під час оформлення"
            : freeShipping
              ? "Безкоштовно"
              : "За тарифами перевізника"}
        </span>
      </p>

      {threshold === null ? null : (
        <p className={styles.note}>
          {threshold === 0
            ? "Безкоштовна доставка для всіх замовлень."
            : `Безкоштовна доставка від ${formatMoney(threshold)} суми товарів${promotion ? " після знижки" : ""}.`}
        </p>
      )}

      {freeShipping || !remainder || shippingPending ? null : (
        <div className={styles.progress}>
          <span>
            {promotion
              ? `До безкоштовної доставки залишилося ${formatMoney(remainder)} після знижок.`
              : `Додайте ще на ${formatMoney(remainder)} — і доставка за наш кошт`}
          </span>
          <span className={styles.progressTrack}>
            <span
              className={styles.progressBar}
              style={{ width: `${progress}%` }}
            />
          </span>
        </div>
      )}

      {!cart.minOrderAmount ? null : (
        <p className={styles.note}>
          Мінімальна сума замовлення — {formatMoney(cart.minOrderAmount)}.
          {cart.minOrderRemainder
            ? ` Додайте товарів ще на ${formatMoney(cart.minOrderRemainder)}, щоб оформити замовлення.`
            : null}
        </p>
      )}

      <p className={styles.summaryTotal}>
        <span>Разом за товари</span>
        <span>{formatMoney(total)}</span>
      </p>

      {action === "none" || cart.minOrderRemainder ? null : (
        <a
          href="/checkout"
          className={buttonStyles({ size: "lg", block: true })}
        >
          Оформити замовлення
        </a>
      )}

      <p className={styles.note}>
        {freeShipping
          ? "Доставку оплачує магазин."
          : "Вартість доставки Новою поштою розраховується за тарифами перевізника під час відправлення."}
      </p>
    </aside>
  );
}
