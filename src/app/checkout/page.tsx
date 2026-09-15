import type { Metadata } from "next";
import { Suspense } from "react";

import { Section } from "@/components/ui/section";
import { ProductGridSkeleton } from "@/features/catalog/components/product-grid-skeleton";
import { CartEmpty } from "@/features/cart/components/cart-view";
import { CartSummary } from "@/features/cart/components/cart-summary";
import { getCart } from "@/features/cart/queries";
import { CheckoutForm } from "@/features/checkout/components/checkout-form";
import { formatMoney } from "@/lib/money";

import styles from "./checkout.module.css";

export const metadata: Metadata = {
  title: "Оформлення замовлення",
  description: "Оформлення замовлення без реєстрації — доставка Новою Поштою по Україні.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <Section
      title="Оформлення замовлення"
      description="Без реєстрації — достатньо контактів і відділення для доставки."
    >
      <Suspense fallback={<ProductGridSkeleton count={2} />}>
        <CheckoutContent />
      </Suspense>
    </Section>
  );
}

async function CheckoutContent() {
  const cart = await getCart();

  if (cart.isEmpty) return <CartEmpty />;

  return (
    <div className={styles.layout}>
      <CheckoutForm />

      <CartSummary cart={cart} action="none">
        <ul className={styles.items}>
          {cart.lines.map((line) => (
            <li key={line.key} className={styles.item}>
              <span className={styles.itemName}>
                {line.title} · {line.size} × {line.quantity}
              </span>
              <span>{formatMoney(line.lineTotal)}</span>
            </li>
          ))}
        </ul>
      </CartSummary>
    </div>
  );
}
