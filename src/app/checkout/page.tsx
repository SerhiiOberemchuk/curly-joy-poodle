import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { buttonStyles } from "@/components/ui/button";
import { readCartCookie } from "@/features/cart/cart-cookie";
import { loadCart, matchesStored } from "@/features/cart/queries";
import { createCheckoutToken } from "@/features/checkout/checkout-attempt";
import {
  availableDeliveries,
  availablePayments,
  sellsInHryvnia,
} from "@/features/checkout/options";
import { CheckoutForm } from "@/features/checkout/components/checkout-form";
import { marketingConsentEnabled } from "@/features/checkout/marketing-consent";
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
    !sellsInHryvnia(capabilities) ||
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
          Додайте товарів ще на{" "}
          {formatMoney(cart.minOrderAmount - cart.subtotal)}.
        </p>
        <Link href="/cart" className={buttonStyles({ size: "lg" })}>
          Повернутися до кошика
        </Link>
      </section>
    );
  }
  const checkoutToken = await createCheckoutToken();
  return (
    <CheckoutForm
      cart={cart}
      capabilities={capabilities}
      checkoutToken={checkoutToken}
      stockAdjusted={!matchesStored(stored, cart)}
      offerMarketingConsent={marketingConsentEnabled()}
    />
  );
}
