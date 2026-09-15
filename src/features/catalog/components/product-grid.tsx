import type { ProductListItem } from "../types";
import { ProductCard } from "./product-card";
import styles from "./product-grid.module.css";

export function ProductGrid({ products }: { products: readonly ProductListItem[] }) {
  if (products.length === 0) {
    return (
      <p className={styles.empty}>
        За цим фільтром товарів немає. Спробуйте іншу категорію або перегляньте весь каталог.
      </p>
    );
  }

  return (
    <div className={styles.grid}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
