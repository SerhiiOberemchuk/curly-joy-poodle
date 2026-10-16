"use client";

import { useEffect } from "react";

import { useCartStore, useCartStoreApi } from "../cart-store";
import type { Cart } from "../types";
import { CartEmptyContent } from "./cart-empty-content";
import { CartLineItem } from "./cart-line-item";
import { CartSummary } from "./cart-summary";
import styles from "./cart-view.module.css";

export function CartClient({ initialCart }: { initialCart: Cart }) {
  const store = useCartStoreApi();
  const currentCart = useCartStore((state) => state.cart);
  const source = useCartStore((state) => state.source);
  const error = useCartStore((state) => state.error);

  useEffect(() => {
    store.getState().hydrate(initialCart);
  }, [initialCart, store]);

  const cart = source === initialCart && currentCart ? currentCart : initialCart;
  if (cart.isEmpty) {
    return (
      <>
        <CartEmptyContent
          freeShippingThreshold={cart.freeShippingThreshold}
          minOrderAmount={cart.minOrderAmount}
        />
        {error ? <p className={styles.lineError} role="alert">{error}</p> : null}
      </>
    );
  }

  return (
    <div className={styles.layout}>
      <div className={styles.lines}>
        {cart.lines.map((line) => <CartLineItem key={line.variantId} line={line} />)}
        {error ? <p className={styles.lineError} role="alert">{error}</p> : null}
      </div>
      <CartSummary cart={cart} action={error ? "none" : "checkout"} />
    </div>
  );
}
