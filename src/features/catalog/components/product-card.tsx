import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";

import type { ProductListItem } from "../types";
import { ProductArtwork } from "./product-artwork";
import styles from "./product-card.module.css";

export function ProductCard({ product }: { product: ProductListItem }) {
  const uniqueSizes = Array.from(new Set(product.sizes));

  return (
    <article className={styles.card}>
      <div className={styles.media}>
        {product.badges.length > 0 ? (
          <div className={styles.badges}>
            {product.badges.map((badge) => (
              <Badge key={badge} tone="accent">
                {badge}
              </Badge>
            ))}
          </div>
        ) : null}

        <ProductArtwork image={product.image} />

        {product.inStock ? null : <p className={styles.soldOut}>Немає в наявності</p>}
      </div>

      <div className={styles.body}>
        {product.line ? <p className={styles.line}>{product.line}</p> : null}
        <h3 className={styles.title}>
          <Link href={`/product/${product.slug}`}>{product.title}</Link>
        </h3>
        <p className={styles.summary}>{product.summary}</p>

        <div className={styles.footer}>
          <Price
            amount={product.priceFrom}
            compareAtAmount={product.compareAtPrice}
            size="sm"
            prefix={uniqueSizes.length > 1 ? "від" : undefined}
          />
          <ul className={styles.sizes} aria-label="Доступні розміри">
            {uniqueSizes.map((size) => (
              <li key={size} className={styles.size}>
                {size}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
