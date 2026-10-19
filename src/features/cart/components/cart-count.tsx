"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

import { browserCartItemCount, subscribeBrowserCart } from "../cart-cookie.client";
import { useCartStore } from "../cart-store";
import styles from "./cart-indicator.module.css";

export function CartCount({ serverCount }: { serverCount: number }) {
  const pathname = usePathname();
  const cart = useCartStore((state) => state.cart);
  const browserCount = useSyncExternalStore(
    subscribeBrowserCart,
    () => browserCartItemCount() ?? serverCount,
    () => serverCount,
  );
  const count = pathname === "/cart" && cart
    ? cart.itemCount
    : browserCount;

  return (
    <span className={styles.count}>
      <span className="visually-hidden">, товарів: </span>
      {count}
    </span>
  );
}
