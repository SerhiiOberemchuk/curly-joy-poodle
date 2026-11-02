import Link from "next/link";

import { Icon } from "@/components/ui/icon";

import { getCartItemCount } from "../queries";
import { CartCount } from "./cart-count";
import styles from "./cart-indicator.module.css";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <Link href="/cart" className={styles.link}>
      <Icon name="cart" />
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
  const count = await getCartItemCount();

  return (
    <Shell>
      <CartCount serverCount={count} />
    </Shell>
  );
}
