import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { buttonStyles } from "@/components/ui/button";
import { CartSummary } from "@/features/cart/components/cart-summary";
import { getCart } from "@/features/cart/queries";
import { CheckoutForm } from "@/features/checkout/components/checkout-form";
import { formatMoney } from "@/lib/money";

import styles from "./checkout.module.css";

export const metadata: Metadata = {
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
      <Suspense fallback={<div className={styles.loading}>Готуємо замовлення…</div>}>
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

  return (
    <div className={styles.layout}>
      <section className={styles.formPanel} aria-label="Дані замовлення">
        <CheckoutForm total={cart.subtotal} />
      </section>
      <CartSummary cart={cart} action="none">
        <div className={styles.items}>
          {cart.lines.map((line) => (
            <p className={styles.item} key={line.key}>
              <span className={styles.itemName}>{line.title} · {line.size} × {line.quantity}</span>
              <strong>{formatMoney(line.lineTotal)}</strong>
            </p>
          ))}
        </div>
      </CartSummary>
    </div>
  );
}
