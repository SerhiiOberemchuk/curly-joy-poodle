import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { buttonStyles } from "@/components/ui/button";
import { CartSummary } from "@/features/cart/components/cart-summary";
import { getCart } from "@/features/cart/queries";
import { getCapabilities } from "@/features/checkout/crm";
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

async function CheckoutContent() {
  const cart = await getCart();

  if (cart.isEmpty) {
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

  let capabilities;
  try {
    capabilities = await getCapabilities();
  } catch {
    return (
      <section className={styles.empty}>
        <h2>Оформлення тимчасово недоступне</h2>
        <p>
          Не вдалося завантажити способи доставки та оплати. Спробуйте ще раз
          пізніше.
        </p>
      </section>
    );
  }
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
