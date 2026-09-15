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

  return (
    <span className={`${styles.price} ${styles[size]}`}>
      {prefix ? <span className={styles.prefix}>{prefix}</span> : null}
      <span>{formatMoney(amount)}</span>
      {discounted ? (
        <span className={styles.compare}>{formatMoney(compareAtAmount)}</span>
      ) : null}
    </span>
  );
}
