import type { Metadata } from "next";
import { Suspense } from "react";

import { Section } from "@/components/ui/section";
import { CartView } from "@/features/cart/components/cart-view";
import { ProductGridSkeleton } from "@/features/catalog/components/product-grid-skeleton";

export const metadata: Metadata = {
  title: "Кошик",
  description: "Ваше замовлення в Curly Joy Store.",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <Section title="Кошик" description="Перевірте розміри й кількість перед оформленням.">
      {/* The cart lives in a cookie, so it streams in after the page shell. */}
      <Suspense fallback={<ProductGridSkeleton count={2} />}>
        <CartView />
      </Suspense>
    </Section>
  );
}
