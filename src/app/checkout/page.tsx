import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { buttonStyles } from "@/components/ui/button";
import { readCartCookie } from "@/features/cart/cart-cookie";
import { CartSummary } from "@/features/cart/components/cart-summary";
import { loadCart } from "@/features/cart/queries";
import { createCheckoutToken } from "@/features/checkout/checkout-attempt";
import {
  availableDeliveries,
  availablePayments,
} from "@/features/checkout/options";
import { CheckoutForm } from "@/features/checkout/components/checkout-form";
import { formatMoney } from "@/lib/money";

import styles from "./checkout.module.css";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Оформлення замовлення",
  description: "Контактні дані, доставка та оплата замовлення Curly Joy.",
};

export default function Page() {
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Останній крок</p>
        <h1>Оформлення замовлення</h1>
        <p>Заповніть контакти та оберіть зручний спосіб доставки.</p>
      </header>
      <Suspense
        fallback={<div className={styles.loading}>Готуємо замовлення…</div>}
      >
        <CheckoutContent />
      </Suspense>
    </div>
  );
}

function EmptyCart() {
  return (
    <section className={styles.empty}>
      <h2>Кошик порожній</h2>
      <p>Спочатку додайте товари, а потім поверніться до оформлення.</p>
      <Link href="/catalog" className={buttonStyles({ size: "lg" })}>
        Перейти до каталогу
      </Link>
    </section>
  );
}

async function CheckoutContent() {
  const stored = await readCartCookie();
  if (stored.length === 0) return <EmptyCart />;

  let loaded;
  try {
    loaded = await loadCart(stored);
  } catch {
    return (
      <section className={styles.empty}>
        <h2>Оформлення тимчасово недоступне</h2>
        <p>
          Не вдалося перевірити товари, доставку та оплату. Ваш кошик збережено
          — спробуйте ще раз за кілька хвилин.
        </p>
      </section>
    );
  }
  const { cart, capabilities } = loaded;
  if (cart.isEmpty) return <EmptyCart />;
  if (
    capabilities.cart.currency !== "UAH" ||
    !availableDeliveries(capabilities).length ||
    !availablePayments(capabilities).length
  ) {
    return (
      <section className={styles.empty}>
        <h2>Оформлення тимчасово недоступне</h2>
        <p>Зверніться до нас для оформлення замовлення.</p>
      </section>
    );
  }
  if (cart.minOrderAmount !== null && cart.subtotal < cart.minOrderAmount) {
    return (
      <section className={styles.empty}>
        <h2>Додайте товари до замовлення</h2>
        <p>
          Мінімальна сума замовлення — {formatMoney(cart.minOrderAmount)}.{" "}
          Додайте товарів ще на {formatMoney(cart.minOrderAmount - cart.subtotal)}.
        </p>
        <Link href="/cart" className={buttonStyles({ size: "lg" })}>
          Повернутися до кошика
        </Link>
      </section>
    );
  }
  const checkoutToken = await createCheckoutToken();
  return (
    <div className={styles.layout}>
      <section className={styles.formPanel} aria-label="Дані замовлення">
        <CheckoutForm total={cart.subtotal} capabilities={capabilities} checkoutToken={checkoutToken} />
      </section>
      <CartSummary cart={cart} action="none">
        <div className={styles.items}>
          {cart.lines.map((line) => (
            <p className={styles.item} key={line.variantId}>
              <span className={styles.itemName}>
                {line.title}
                {line.option ? ` · ${line.option}` : ""} × {line.quantity}
              </span>
              <strong>{formatMoney(line.lineTotal)}</strong>
            </p>
          ))}
        </div>
      </CartSummary>
    </div>
  );
}
