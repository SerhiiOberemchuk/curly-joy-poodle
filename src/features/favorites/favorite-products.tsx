"use client";

import Link from "next/link";

import { Icon } from "@/components/ui/icon";
import type { ProductListItem } from "@/features/catalog/types";
import { ProductTile } from "@/features/home/components/product-tile";
import styles from "@/features/home/home.module.css";

import { useFavorites } from "./favorites";

/** The saved products, resolved against the live catalog in this browser. */
export function FavoriteProducts({ products }: { products: readonly ProductListItem[] }) {
  const { ids } = useFavorites();
  const saved = products.filter((product) => ids.includes(product.id));

  if (saved.length === 0) {
    return (
      <div className={styles.emptyResults}>
        <Icon name="heart" />
        <p>Тут з’являться товари, які ви позначите сердечком.</p>
        <Link href="/catalog">
          Перейти до каталогу <span aria-hidden="true">→</span>
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.favoriteGrid}>
      {saved.map((product) => (
        <ProductTile key={product.id} product={product} headingLevel={2} />
      ))}
    </div>
  );
}
