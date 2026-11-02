import type { ProductListItem } from "../types";
import { ProductCard } from "./product-card";
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
