import type { Metadata } from "next";
import { Suspense } from "react";

import { CartSkeleton } from "@/features/cart/components/cart-skeleton";
import { CartView } from "@/features/cart/components/cart-view";

import styles from "./cart.module.css";
import { PageTransition } from "@/components/layout/page-transition";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Кошик",
  description: "Ваші обрані товари Curly Joy перед оформленням замовлення.",
};

export default function Page() {
  return (
    <PageTransition>
      <div className={styles.page}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Майже готово</p>
          <h1 id="cart-title" tabIndex={-1}>Ваш кошик</h1>
          <p>Перевірте товари й кількість — далі залишиться лише оформити доставку.</p>
        </header>

        <section className={styles.content} aria-label="Товари у кошику">
          <Suspense fallback={<CartSkeleton />}>
            <CartView />
          </Suspense>
        </section>
      </div>
    </PageTransition>
  );
}
