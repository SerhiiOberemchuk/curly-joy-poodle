import { ProductGrid } from "./product-grid";
import { SortSelect } from "./sort-select";
import styles from "./catalog-toolbar.module.css";
import { getProducts } from "../queries";
import { isSortOption } from "../sorting";
import type { Collection } from "../types";

export type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function pluralize(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "товар";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "товари";
  return "товарів";
}

/**
 * Reads `?sort` and renders the listing. Dynamic by nature — every caller keeps
 * it inside a `<Suspense>` boundary so the surrounding page still prerenders.
 */
export async function SortedProductList({
  searchParams,
  category,
  collection,
}: {
  searchParams: SearchParams;
  category?: string;
  collection?: Collection;
}) {
  const params = await searchParams;
  const requested = Array.isArray(params.sort) ? params.sort[0] : params.sort;
  const sort = isSortOption(requested) ? requested : "featured";

  const products = await getProducts({ category, collection, sort });

  return (
    <>
      <div className={styles.toolbar}>
        <p className={styles.count}>
          {products.length} {pluralize(products.length)}
        </p>
        <SortSelect value={sort} />
      </div>
      <ProductGrid products={products} />
    </>
  );
}
