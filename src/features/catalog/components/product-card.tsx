import Link from "next/link";

import { Price } from "@/components/ui/price";

import type { ProductListItem } from "../types";
import { ProductArtwork } from "./product-artwork";
import styles from "./product-card.module.css";

export function ProductCard({ product }: { product: ProductListItem }) {
  const uniqueOptions = Array.from(new Set(product.options));

  return (
    <article className={styles.card}>
      <div className={styles.media}>
        <ProductArtwork image={product.image} />

        {product.inStock ? null : <p className={styles.soldOut}>Немає в наявності</p>}
      </div>

      <div className={styles.body}>
        {product.brand ? <p className={styles.line}>{product.brand}</p> : null}
        <h3 className={styles.title}>
          <Link href={`/product/${product.slug}`}>{product.title}</Link>
        </h3>
        {product.summary ? <p className={styles.summary}>{product.summary}</p> : null}

        <div className={styles.footer}>
          <Price
            amount={product.priceFrom}
            compareAtAmount={product.compareAtPrice}
            size="sm"
            prefix={uniqueOptions.length > 1 ? "від" : undefined}
          />
          {uniqueOptions.length > 0 ? (
            <ul className={styles.sizes} aria-label="Доступні варіанти">
              {uniqueOptions.map((option) => (
                <li key={option} className={styles.size}>
                  {option}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </article>
  );
}
