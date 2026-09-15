import Link from "next/link";
import type { ReactNode } from "react";

import { buttonStyles } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";

import { FREE_SHIPPING_THRESHOLD } from "../constants";
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
  const progress = Math.min(100, Math.round((cart.subtotal / FREE_SHIPPING_THRESHOLD) * 100));

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
        <span>{cart.freeShipping ? "Безкоштовно" : "За тарифами перевізника"}</span>
      </p>

      {cart.freeShipping ? null : (
        <div className={styles.progress}>
          <span>
            Додайте ще на {formatMoney(cart.freeShippingRemainder)} — і доставка за наш кошт
          </span>
          <span className={styles.progressTrack}>
            <span className={styles.progressBar} style={{ width: `${progress}%` }} />
          </span>
        </div>
      )}

      <p className={styles.summaryTotal}>
        <span>До сплати</span>
        <span>{formatMoney(cart.subtotal)}</span>
      </p>

      {action === "none" ? null : (
        <Link href="/checkout" className={buttonStyles({ size: "lg", block: true })}>
          Оформити замовлення
        </Link>
      )}

      <p className={styles.note}>
        Вартість доставки Новою Поштою розраховується за тарифами перевізника під час відправлення.
      </p>
    </aside>
  );
}
