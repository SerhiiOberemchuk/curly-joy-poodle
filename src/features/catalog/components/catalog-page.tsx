import { Suspense } from "react";

import { RecentlyViewedProducts } from "@/features/recently-viewed/viewed-products";

import { CATALOG_PAGE_SIZE, filterFacets, filterSections } from "../filtering";
import { getCategories, getProducts } from "../queries";
import { defaultSort, sortProductList } from "../sorting";
import {
  CatalogHeading,
  HiddenWhileSearching,
  SearchAwareHeading,
} from "./catalog-heading";
import { CatalogResultsSkeleton } from "./catalog-results";
import { CategoryTiles } from "./category-tiles";
import { cardShape } from "./product-card";
import {
  SortedProductList,
  type SearchParams,
} from "./sorted-product-list";
import styles from "./catalog-page.module.css";

interface CatalogPageProps {
  title: string;
  eyebrow: string;
  description: string;
  searchParams: SearchParams;
  /** Slug of the category the page lists. */
  category?: string;
  collection?: string;
}

/**
 * The heading, the category tiles and the list's frame are in the static
 * shell. A search (`?q=`) swaps the heading for its own and hides the tiles —
 * read from the URL in the browser, so at once on a client navigation — and
 * the list streams into a skeleton of its size.
 */
export function CatalogPage({
  title,
  eyebrow,
  description,
  searchParams,
  category,
  collection,
}: CatalogPageProps) {
  // The catalog itself is the top level; categories and collections sit under it.
  const heading = { title, eyebrow, description, nested: Boolean(category || collection) };

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <Suspense fallback={<CatalogHeading {...heading} />}>
          <SearchAwareHeading {...heading} />
        </Suspense>

        <section className={styles.catalog} id="products" aria-labelledby="products-title">
          <h2 id="products-title" className="visually-hidden">Товари каталогу</h2>

          {collection ? null : (
            <Suspense fallback={<CategoryTiles parentSlug={category} />}>
              <HiddenWhileSearching>
                <CategoryTiles parentSlug={category} />
              </HiddenWhileSearching>
            </Suspense>
          )}

          <Suspense fallback={<ListSkeleton category={category} collection={collection} />}>
            <SortedProductList
              searchParams={searchParams}
              category={category}
              collection={collection}
            />
          </Suspense>
        </section>
        <RecentlyViewedProducts />
      </div>
    </div>
  );
}

/**
 * Shaped by the cached list as the page first shows it — no search or
 * filters, the default order — so each card keeps its row's height.
 */
async function ListSkeleton({ category, collection }: { category?: string; collection?: string }) {
  const [listed, categories] = await Promise.all([
    getProducts({ category, collection }).catch(() => []),
    getCategories().catch(() => []),
  ]);
  const products = sortProductList(listed, defaultSort);
  const facets = filterFacets(products);
  const sections = filterSections(facets);
  return (
    <CatalogResultsSkeleton
      shapes={products.slice(0, CATALOG_PAGE_SIZE).map(cardShape)}
      paged={products.length > CATALOG_PAGE_SIZE}
      filters={{
        // «Усі товари» and every top-level category, as the list links them.
        categories: 1 + categories.filter((item) => item.parentId === null).length,
        brands: sections.brands ? facets.brands.length : 0,
        price: sections.price,
        checks: Number(sections.inStock) + Number(sections.sale),
      }}
    />
  );
}
