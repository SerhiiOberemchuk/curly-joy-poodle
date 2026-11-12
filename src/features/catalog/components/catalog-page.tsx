import { Suspense } from "react";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { RecentlyViewedProducts } from "@/features/recently-viewed/viewed-products";

import { SearchHeading } from "./catalog-heading";
import { CategoryTiles } from "./category-tiles";
import {
  CatalogListing,
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
 * shell, once each. A search (`?q=`) adds its own heading, which hides the
 * page's heading and the tiles; the list streams into a skeleton of its size.
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
  const nested = Boolean(category || collection);

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.browsing}>
          <div className={styles.crumbs}>
            <Breadcrumbs
              trail={nested ? [{ href: "/catalog", label: "Каталог" }] : []}
              current={title}
            />
          </div>
          <header className={styles.heading}>
            <div>
              <p className={styles.eyebrow}>{eyebrow}</p>
              <h1 id="catalog-title">{title}</h1>
            </div>
            <p className={styles.description}>{description}</p>
          </header>
        </div>
        <Suspense fallback={null}>
          <SearchHeading />
        </Suspense>

        <section className={styles.catalog} id="products" aria-labelledby="products-title">
          <h2 id="products-title" className="visually-hidden">Товари каталогу</h2>

          {collection ? null : (
            <div className={styles.browsing}>
              <CategoryTiles parentSlug={category} />
            </div>
          )}

          <CatalogListing searchParams={searchParams} category={category} collection={collection} />
        </section>
        <RecentlyViewedProducts />
      </div>
    </div>
  );
}
