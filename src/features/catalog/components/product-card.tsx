import Link from "next/link";

import { Price } from "@/components/ui/price";
import { Bone } from "@/components/ui/skeleton";
import { FavoriteToggle } from "@/features/favorites/favorites";
import { ProductCardRating } from "@/features/reviews/components/product-card-rating";

import { onSale } from "../filtering";
import type { ProductListItem } from "../types";
import { discountPercent } from "../pricing";
import { CardCartButton } from "./card-cart-button";
import { ProductArtwork } from "./product-artwork";
import styles from "./product-card.module.css";

/** Variant chips that fit a card; the rest is summed up as «+N». */
const VISIBLE_OPTIONS = 4;

/** The lines that change a card's height; a skeleton keeps the same ones. */
export interface ProductCardShape {
  brand: boolean;
  options: boolean;
  /** In stock: the 44 px cart button sets the footer's height. */
  cart: boolean;
  /** A crossed-out old price above the current one. */
  oldPrice: boolean;
}

/** The most common card: a brand line, no variant chips, in stock. */
const typicalCardShape: ProductCardShape = {
  brand: true,
  options: false,
  cart: true,
  oldPrice: false,
};

export function cardShape(product: ProductListItem): ProductCardShape {
  return {
    brand: Boolean(product.brand),
    options: product.options.length > 0,
    cart: product.inStock,
    oldPrice: onSale(product),
  };
}

/** The card's own frame and lines while its product streams in. */
export function ProductCardSkeleton({
  shape = typicalCardShape,
}: {
  shape?: ProductCardShape;
}) {
  return (
    <div className={styles.card}>
      <div className={styles.media}>
        <Bone className={styles.mediaBone} />
      </div>
      <div className={styles.body}>
        {shape.brand ? <Bone line className={`${styles.brand} ${styles.brandBone}`} /> : null}
        <div className={styles.title}>
          <Bone line />
          <Bone line className={styles.titleBoneShort} />
        </div>
        <div className={styles.rating} />
        {shape.options ? <Bone className={styles.optionsBone} /> : null}
        <div className={styles.footer}>
          <div className={styles.priceBones}>
            {shape.oldPrice ? <Bone line className={styles.oldPriceBone} /> : null}
            <Bone line className={styles.priceBone} />
          </div>
          {shape.cart ? <Bone className={styles.cartBone} /> : null}
        </div>
      </div>
    </div>
  );
}

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
        <ProductCardRating productId={product.id} />
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
