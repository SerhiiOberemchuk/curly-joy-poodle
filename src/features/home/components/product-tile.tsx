import Image from "next/image";
import Link from "next/link";

import type { ProductListItem } from "@/features/catalog/types";
import { FavoriteToggle } from "@/features/favorites/favorites";
import { formatMoney } from "@/lib/money";

import styles from "../home.module.css";

/**
 * Compact product card used by «Curly Joy рекомендує» and the favourites page.
 * The title is the heading; the photo is decorative because the title sits
 * right next to it inside the same link.
 */
export function ProductTile({
  product,
  headingLevel = 3,
}: {
  product: ProductListItem;
  /** Keeps the outline intact where the tile sits directly under an h1. */
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <article className={styles.productCard}>
      <FavoriteToggle
        productId={product.id}
        productTitle={product.title}
        className={styles.productFavorite}
      />
      <Link href={`/product/${product.slug}`} className={styles.productLink}>
        <div className={styles.productImage}>
          {product.image.src ? (
            <Image src={product.image.src} alt="" fill sizes="(max-width: 768px) 45vw, 240px" />
          ) : (
            <span className={styles.productPlaceholder} aria-hidden="true">
              🐾
            </span>
          )}
        </div>
        {product.brand ? <p className={styles.productBrand}>{product.brand}</p> : null}
        <Heading className={styles.productTitle}>{product.title}</Heading>
        <strong className={styles.productPrice}>
          {product.options.length > 1 ? "від " : ""}
          {formatMoney(product.priceFrom)}
        </strong>
      </Link>
    </article>
  );
}
