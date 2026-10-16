import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";

import styles from "./cart-view.module.css";

export function CartEmptyContent({
  freeShippingThreshold,
  minOrderAmount,
}: {
  freeShippingThreshold: number | null;
  minOrderAmount: number | null;
}) {
  return (
    <div className={styles.empty}>
      <span className={styles.emptyGlyph} aria-hidden="true">🛒</span>
      <h2>Кошик порожній</h2>
      <p className={styles.emptyText}>
        Перегляньте каталог і додайте товари, які вам сподобалися.
      </p>
      {freeShippingThreshold !== null ? (
        <p className={styles.emptyText}>
          {freeShippingThreshold === 0
            ? "Безкоштовна доставка для всіх замовлень."
            : `Безкоштовна доставка від ${formatMoney(freeShippingThreshold)} суми товарів.`}
        </p>
      ) : null}
      {minOrderAmount ? (
        <p className={styles.emptyText}>
          Мінімальна сума замовлення — {formatMoney(minOrderAmount)}.
        </p>
      ) : null}
      <Link href="/catalog" className={buttonStyles({ size: "lg" })}>
        Перейти до каталогу
      </Link>
    </div>
  );
}
