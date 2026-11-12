import Link from "next/link";
import { Suspense } from "react";

import { buttonStyles } from "@/components/ui/button";
import { ProductShelf, ProductShelfSkeleton } from "@/features/catalog/components/product-shelf";
import { getProducts } from "@/features/catalog/queries";
import type { ProductListItem } from "@/features/catalog/types";
import { getDisplayCartTerms } from "@/features/checkout/cart-terms.server";

import { retryCartAction } from "../actions";
import { calculateCart } from "../calculate";
import { CART_SUGGESTION_LIMIT } from "../constants";
import { getCart } from "../queries";
import { CartClient } from "./cart-client";
import styles from "./cart-view.module.css";

/** In-stock products the cart does not hold yet, cheapest first. */
async function suggestionsFor(variantIds: readonly string[]): Promise<ProductListItem[]> {
  const inCart = new Set(variantIds);
  const products = await getProducts().catch((): ProductListItem[] => []);
  return products
    .filter((product) => product.inStock && !(product.variantId && inCart.has(product.variantId)))
    .sort((a, b) => a.priceFrom - b.priceFrom)
    .slice(0, CART_SUGGESTION_LIMIT);
}

async function CartSuggestions({ variantIds }: { variantIds: readonly string[] }) {
  const suggestions = await suggestionsFor(variantIds);
  return suggestions.length > 0 ? (
    <ProductShelf products={suggestions} label="Товари, які можна додати" />
  ) : (
    <p>Більше товарів для вашого улюбленця — у <Link href="/catalog">каталозі</Link>.</p>
  );
}

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
          спробуйте ще раз трохи згодом.
        </p>
        <form action={retryCartAction}>
          <button type="submit" className={buttonStyles({ size: "lg" })}>
            Спробувати ще раз
          </button>
        </form>
      </div>
    );
  }

  if (cart.isEmpty) return <CartEmpty />;

  return (
    <CartClient initialCart={cart}>
      <section className={styles.suggestions} aria-labelledby="cart-suggestions-title">
        <h2 id="cart-suggestions-title">Додайте до замовлення</h2>
        <p>Приємні дрібниці, які легко додати до кошика.</p>
        <Suspense fallback={<ProductShelfSkeleton count={CART_SUGGESTION_LIMIT} />}>
          <CartSuggestions variantIds={cart.lines.map((line) => line.variantId)} />
        </Suspense>
      </section>
    </CartClient>
  );
}
