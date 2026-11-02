import type { ProductListItem } from "../types";
import { ProductCard, ProductCardSkeleton, type ProductCardShape } from "./product-card";
import styles from "./product-grid.module.css";

export function ProductGrid({
  products,
  emptyMessage = "За цим фільтром товарів немає. Спробуйте іншу категорію або перегляньте весь каталог.",
  wide = false,
  headingLevel,
}: {
  products: readonly ProductListItem[];
  emptyMessage?: string;
  /** The grid spans the page's full width: five cards a row on wide screens. */
  wide?: boolean;
  headingLevel?: 2 | 3;
}) {
  if (products.length === 0) {
    return <p className={styles.empty}>{emptyMessage}</p>;
  }

  return (
    <div className={styles.frame}>
      <ul className={wide ? `${styles.grid} ${styles.wide}` : styles.grid}>
        {products.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} headingLevel={headingLevel} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The grid's own columns with a skeleton card per expected product: `cards`
 * is the shape of each, or just how many typical cards when that is unknown.
 * `singleRow` shows only as many as the grid's columns, for a list whose
 * length the page cannot know yet.
 */
export function ProductGridSkeleton({
  cards,
  wide = false,
  singleRow = false,
}: {
  cards: number | readonly ProductCardShape[];
  wide?: boolean;
  singleRow?: boolean;
}) {
  const shapes = typeof cards === "number" ? Array<undefined>(cards).fill(undefined) : cards;
  const className = [styles.grid, wide && styles.wide, singleRow && styles.singleRow]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={styles.frame} aria-hidden="true">
      <div className={className}>
        {shapes.map((shape, index) => (
          <div key={index}>
            <ProductCardSkeleton shape={shape} />
          </div>
        ))}
      </div>
    </div>
  );
}
