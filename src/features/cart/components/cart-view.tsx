import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { getDisplayCartTerms } from "@/features/checkout/cart-terms.server";
import { formatMoney } from "@/lib/money";

import { getCart } from "../queries";
import { CartLineItem } from "./cart-line-item";
import { CartSummary } from "./cart-summary";
import styles from "./cart-view.module.css";

export async function CartEmpty() {
  const terms = await getDisplayCartTerms().catch(() => null);
  const freeShippingThreshold = terms?.freeShippingThreshold ?? null;
  return (
    <div className={styles.empty}>
      <span className={styles.emptyGlyph} aria-hidden="true">
        🛒
      </span>
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
      {terms?.minOrderAmount ? (
        <p className={styles.emptyText}>
          Мінімальна сума замовлення — {formatMoney(terms.minOrderAmount)}.
        </p>
      ) : null}
      <Link href="/catalog" className={buttonStyles({ size: "lg" })}>
        Перейти до каталогу
      </Link>
    </div>
  );
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

  return (
    <div className={styles.layout}>
      <div className={styles.lines}>
        {cart.lines.map((line) => (
          <CartLineItem key={line.variantId} line={line} />
        ))}
      </div>

      <CartSummary cart={cart} />
    </div>
  );
}
