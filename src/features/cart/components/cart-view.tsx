import { getDisplayCartTerms } from "@/features/checkout/cart-terms.server";

import { calculateCart } from "../calculate";
import { getCart } from "../queries";
import { CartClient } from "./cart-client";
import styles from "./cart-view.module.css";

export async function CartEmpty() {
  const terms = await getDisplayCartTerms().catch(() => null);
  const cart = calculateCart([], {
    freeShippingThreshold: terms?.freeShippingThreshold ?? null,
    minOrderAmount: terms?.minOrderAmount ?? null,
  });
  return <CartClient initialCart={cart} />;
}

export async function CartView() {
  let cart;
  try {
    cart = await getCart();
  } catch {
    // Prices and stock come only from the CRM; nothing is shown without them.
    return (
      <div className={styles.empty} role="alert">
        <h2>Не вдалося завантажити кошик</h2>
        <p className={styles.emptyText}>
          Не вдалося перевірити ціни й наявність товарів. Ваш кошик збережено —
          оновіть сторінку за кілька хвилин.
        </p>
      </div>
    );
  }

  if (cart.isEmpty) return <CartEmpty />;

  return <CartClient initialCart={cart} />;
}
