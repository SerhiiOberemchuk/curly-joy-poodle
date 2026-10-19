"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { Icon } from "@/components/ui/icon";
import type { ProductListItem } from "@/features/catalog/types";
import { ProductTile } from "@/features/home/components/product-tile";
import styles from "@/features/home/home.module.css";

import { useFavoritesStore } from "./favorites";

/** The saved products, resolved against the live catalog in this browser. */
export function FavoriteProducts({ products }: { products: readonly ProductListItem[] }) {
  const ids = useFavoritesStore((state) => state.ids);
  const isHydrated = useFavoritesStore((state) => state.isHydrated);
  const saved = products.filter((product) => ids.includes(product.id));
  const count = saved.length;
  const status = useRef<HTMLParagraphElement>(null);
  const previousCount = useRef<number | null>(null);

  // A heart pressed on this page removes its own tile, and the focus with it.
  useEffect(() => {
    if (!isHydrated) return;
    const previous = previousCount.current;
    previousCount.current = count;
    if (previous === null || count >= previous) return;
    if (status.current)
      status.current.textContent = count ? "Товар прибрано з обраного." : "Обране порожнє.";
    if (document.activeElement === document.body)
      document.getElementById("favorites-title")?.focus();
  }, [count, isHydrated]);

  // First in every branch, so React keeps the same live region mounted.
  const region = <p ref={status} className="visually-hidden" role="status" />;

  if (!isHydrated)
    return (
      <>
        {region}
        <p role="status">Завантажуємо обране…</p>
      </>
    );

  if (count === 0) {
    return (
      <>
        {region}
        <div className={styles.emptyResults}>
          <Icon name="heart" />
          <p>Тут з’являться товари, які ви позначите сердечком.</p>
          <Link href="/catalog">
            Перейти до каталогу <span aria-hidden="true">→</span>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      {region}
      <div className={styles.favoriteGrid}>
        {saved.map((product) => (
          <ProductTile key={product.id} product={product} headingLevel={2} />
        ))}
      </div>
    </>
  );
}
