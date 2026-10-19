import { formatMoney } from "@/lib/money";

import styles from "./price.module.css";

export function Price({
  amount,
  compareAtAmount,
  size = "md",
  prefix,
}: {
  amount: number;
  compareAtAmount?: number;
  size?: "sm" | "md" | "lg";
  prefix?: string;
}) {
  const discounted = compareAtAmount !== undefined && compareAtAmount > amount;

  // Strike-through alone is visual: a screen reader also hears which price is current.
  return (
    <span className={`${styles.price} ${styles[size]}`}>
      {prefix ? <span className={styles.prefix}>{prefix}</span> : null}
      <span>
        {discounted ? <span className="visually-hidden">Ціна зі знижкою: </span> : null}
        {formatMoney(amount)}
      </span>
      {discounted ? (
        <del className={styles.compare}>
          <span className="visually-hidden">Стара ціна: </span>
          {formatMoney(compareAtAmount)}
        </del>
      ) : null}
    </span>
  );
}
