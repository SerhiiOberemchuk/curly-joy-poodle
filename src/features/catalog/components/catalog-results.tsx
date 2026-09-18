"use client";

import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useMemo } from "react";

import { sortProductList, sortValues } from "../sorting";
import type { ProductListItem } from "../types";
import styles from "./catalog-toolbar.module.css";
import { ProductGrid } from "./product-grid";
import { SortSelect } from "./sort-select";

function pluralize(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "товар";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "товари";
  return "товарів";
}

export function CatalogResults({
  products,
}: {
  products: readonly ProductListItem[];
}) {
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsStringLiteral(sortValues)
      .withDefault("featured")
      .withOptions({ history: "replace", shallow: true }),
  );
  const sortedProducts = useMemo(
    () => sortProductList(products, sort),
    [products, sort],
  );

  return (
    <>
      <div className={styles.toolbar}>
        <p className={styles.count}>
          {sortedProducts.length} {pluralize(sortedProducts.length)}
        </p>
        <SortSelect value={sort} onChange={setSort} />
      </div>
      <ProductGrid products={sortedProducts} />
    </>
  );
}
