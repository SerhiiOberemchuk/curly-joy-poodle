import type { ProductListItem } from "../types";
import { ProductCard } from "./product-card";
import styles from "./product-grid.module.css";

export function ProductGrid({
  products,
  emptyMessage = "За цим фільтром товарів немає. Спробуйте іншу категорію або перегляньте весь каталог.",
}: {
  products: readonly ProductListItem[];
  emptyMessage?: string;
}) {
  if (products.length === 0) {
    return <p className={styles.empty}>{emptyMessage}</p>;
  }

  return (
    <div className={styles.grid}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
