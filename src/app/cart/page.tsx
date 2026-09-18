import type { Metadata } from "next";
import { Suspense } from "react";

import { CartView } from "@/features/cart/components/cart-view";

import styles from "./cart.module.css";

export const metadata: Metadata = {
  title: "Кошик",
  description: "Ваші обрані товари Curly Joy перед оформленням замовлення.",
};

export default function Page() {
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Майже готово</p>
        <h1>Ваш кошик</h1>
        <p>Перевірте розміри й кількість — далі залишиться лише оформити доставку.</p>
      </header>

      <section className={styles.content} aria-label="Товари у кошику">
        <Suspense fallback={<CartFallback />}>
          <CartView />
        </Suspense>
      </section>
    </div>
  );
}

function CartFallback() {
  return (
    <div className={styles.loading} aria-label="Завантажуємо кошик">
      <span />
      <span />
    </div>
  );
}
