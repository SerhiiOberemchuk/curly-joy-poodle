import Link from "next/link";

import { getCart } from "../queries";
import styles from "./cart-indicator.module.css";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <Link href="/cart" className={styles.link}>
      <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true" fill="none">
        <path
          d="M3 4h2l1.6 8.4a1.5 1.5 0 0 0 1.5 1.2h6.3a1.5 1.5 0 0 0 1.5-1.2L17 7H6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="8.5" cy="16.5" r="1.2" fill="currentColor" />
        <circle cx="14.5" cy="16.5" r="1.2" fill="currentColor" />
      </svg>
      <span className={styles.label}>Кошик</span>
      {children}
    </Link>
  );
}

/** Placeholder shown in the static shell while the cookie-derived count streams in. */
export function CartIndicatorFallback() {
  return (
    <Shell>
      <span className={styles.countPlaceholder} aria-hidden="true">
        0
      </span>
    </Shell>
  );
}

export async function CartIndicator() {
  const cart = await getCart();

  return (
    <Shell>
      <span className={styles.count} aria-label={`Товарів у кошику: ${cart.itemCount}`}>
        {cart.itemCount}
      </span>
    </Shell>
  );
}
