import Link from "next/link";
import type { ReactNode } from "react";

import { buttonStyles } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";

import type { Cart } from "../types";
import styles from "./cart-view.module.css";

export function CartSummary({
  cart,
  action,
  children,
}: {
  cart: Cart;
  action?: "checkout" | "none";
  /** Optional line-item breakdown rendered above the totals. */
  children?: ReactNode;
}) {
  const progress = cart.freeShippingThreshold
    ? Math.min(
        100,
        Math.round((cart.subtotal / cart.freeShippingThreshold) * 100),
      )
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
          <span>Знижка</span>
          <span className={styles.savings}>−{formatMoney(cart.savings)}</span>
        </p>
      ) : null}

      <p className={styles.summaryRow}>
        <span>Доставка</span>
        <span>
          {cart.freeShipping ? "Безкоштовно" : "За тарифами перевізника"}
        </span>
      </p>

      {cart.freeShippingThreshold === null ? null : (
        <p className={styles.note}>
          {cart.freeShippingThreshold === 0
            ? "Безкоштовна доставка для всіх замовлень."
            : `Безкоштовна доставка від ${formatMoney(cart.freeShippingThreshold)} суми товарів.`}
        </p>
      )}

      {cart.freeShipping || cart.freeShippingRemainder === null ? null : (
        <div className={styles.progress}>
          <span>
            Додайте ще на {formatMoney(cart.freeShippingRemainder)} — і доставка
            за наш кошт
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
        <span>{formatMoney(cart.subtotal)}</span>
      </p>

      {action === "none" || cart.minOrderRemainder ? null : (
        <Link
          href="/checkout"
          className={buttonStyles({ size: "lg", block: true })}
        >
          Оформити замовлення
        </Link>
      )}

      <p className={styles.note}>
        {cart.freeShipping
          ? "Доставку оплачує магазин."
          : "Вартість доставки Новою поштою розраховується за тарифами перевізника під час відправлення."}
      </p>
    </aside>
  );
}
