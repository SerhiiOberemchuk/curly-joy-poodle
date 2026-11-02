"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { buttonStyles } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ProductGrid, ProductGridSkeleton } from "@/features/catalog/components/product-grid";
import type { ProductListItem } from "@/features/catalog/types";

import { useFavoritesStore } from "./favorites";
import styles from "./favorites.module.css";

/** Cards per step: a long list grows on request rather than all at once. */
const PAGE_SIZE = 20;

/** The saved products, resolved against the live catalog in this browser. */
export function FavoriteProducts({ products }: { products: readonly ProductListItem[] }) {
  const ids = useFavoritesStore((state) => state.ids);
  const isHydrated = useFavoritesStore((state) => state.isHydrated);
  const saved = products.filter((product) => ids.includes(product.id));
  const count = saved.length;
  const [shown, setShown] = useState(PAGE_SIZE);
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

  // The saved list is in this browser only: one row of cards until it is read.
  if (!isHydrated)
    return (
      <>
        {region}
        <p className="visually-hidden" role="status">Завантажуємо обране…</p>
        <ProductGridSkeleton cards={5} wide singleRow />
      </>
    );

  if (count === 0) {
    return (
      <>
        {region}
        <div className={styles.empty}>
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
      <ProductGrid products={saved.slice(0, shown)} wide headingLevel={2} />
      {count > shown ? (
        <div className={styles.more}>
          <button
            type="button"
            className={buttonStyles({ variant: "outline", size: "lg" })}
            onClick={() => setShown(shown + PAGE_SIZE)}
          >
            Показати ще ({count - shown})
          </button>
        </div>
      ) : null}
    </>
  );
}
