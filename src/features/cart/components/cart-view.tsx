import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";

import { getCart } from "../queries";
import { CartLineItem } from "./cart-line-item";
import { CartSummary } from "./cart-summary";
import styles from "./cart-view.module.css";

export function CartEmpty() {
  return (
    <div className={styles.empty}>
      <span className={styles.emptyGlyph} aria-hidden="true">
        🛒
      </span>
      <h2>Кошик порожній</h2>
      <p className={styles.emptyText}>
        Почніть з літньої колекції — охолоджувальний жилет і бандана закривають більшість спекотних
        днів.
      </p>
      <Link href="/catalog" className={buttonStyles({ size: "lg" })}>
        Перейти до каталогу
      </Link>
    </div>
  );
}

export async function CartView() {
  const cart = await getCart();

  if (cart.isEmpty) return <CartEmpty />;

  return (
    <div className={styles.layout}>
      <div className={styles.lines}>
        {cart.lines.map((line) => (
          <CartLineItem key={line.key} line={line} />
        ))}
      </div>

      <CartSummary cart={cart} />
    </div>
  );
}
