import Link from "next/link";

import { Price } from "@/components/ui/price";
import { FavoriteToggle } from "@/features/favorites/favorites";

import type { ProductListItem } from "../types";
import { discountPercent } from "../pricing";
import { CardCartButton } from "./card-cart-button";
import { ProductArtwork } from "./product-artwork";
import styles from "./product-card.module.css";

/** Variant chips that fit a card; the rest is summed up as «+N». */
const VISIBLE_OPTIONS = 4;

/**
 * The one product card of the shop: home shelf, catalog, favourites and the
 * product page's suggestions. The title link covers the card; the heart and
 * the cart button sit above it.
 */
export function ProductCard({
  product,
  headingLevel = 3,
}: {
  product: ProductListItem;
  /** Keeps the outline intact where cards sit directly under an h1. */
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const options = Array.from(new Set(product.options));
  const hidden = options.length - VISIBLE_OPTIONS;
  const discount = discountPercent(product.priceFrom, product.compareAtPrice);

  return (
    <article
      className={styles.card}
      data-sold-out={product.inStock ? undefined : true}
    >
      <div className={styles.media}>
        <ProductArtwork image={product.image} decorative />
        {discount || !product.inStock ? (
          <ul className={styles.badges} aria-label="Позначки товару">
            {discount ? (
              <li className={styles.saleBadge}>−{discount}%</li>
            ) : null}
            {product.inStock ? null : (
              <li className={styles.soldOutBadge}>Немає в наявності</li>
            )}
          </ul>
        ) : null}
        <FavoriteToggle
          productId={product.id}
          productTitle={product.title}
          className={styles.favorite}
        />
      </div>

      <div className={styles.body}>
        {product.brand ? <p className={styles.brand}>{product.brand}</p> : null}
        <Heading className={styles.title}>
          <Link href={`/product/${product.slug}`}>{product.title}</Link>
        </Heading>
        {options.length > 0 ? (
          <ul className={styles.options} aria-label="Доступні варіанти">
            {options.slice(0, VISIBLE_OPTIONS).map((option) => (
              <li key={option} className={styles.option}>
                {option}
              </li>
            ))}
            {hidden > 0 ? (
              <li className={styles.option}>
                <span aria-hidden="true">+{hidden}</span>
                <span className="visually-hidden">та ще {hidden}</span>
              </li>
            ) : null}
          </ul>
        ) : null}

        <div className={styles.footer}>
          <Price
            amount={product.priceFrom}
            compareAtAmount={product.compareAtPrice}
            size="card"
            prefix={options.length > 1 ? "від" : undefined}
          />
          {product.inStock ? (
            <CardCartButton
              variantId={product.variantId}
              title={product.title}
              href={`/product/${product.slug}`}
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}
