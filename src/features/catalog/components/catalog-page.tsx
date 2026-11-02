import { Suspense, type ReactNode } from "react";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";

import { readSearchQuery } from "../search";
import { CategoryTiles } from "./category-tiles";
import { ProductGridSkeleton } from "./product-grid-skeleton";
import {
  SortedProductList,
  type SearchParams,
} from "./sorted-product-list";
import styles from "./catalog-page.module.css";

interface CatalogPageProps {
  children?: ReactNode;
  title: ReactNode;
  eyebrow: string;
  description: ReactNode;
  searchParams: SearchParams;
  /** Slug of the category in the URL, read inside the Suspense boundaries that need it. */
  activeCategory?: Promise<string>;
  collection?: string;
}

export function CatalogPage({
  children,
  title,
  eyebrow,
  description,
  searchParams,
  activeCategory,
  collection,
}: CatalogPageProps) {
  // The catalog itself is the top level; categories and collections sit under it.
  const nested = Boolean(activeCategory || collection);

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <Suspense
          fallback={<p className={styles.headingLoading} role="status">Готуємо каталог…</p>}
        >
          <CatalogHeading
            title={title}
            eyebrow={eyebrow}
            description={description}
            searchParams={searchParams}
            nested={nested}
          />
        </Suspense>

        {children ?? (
          <section className={styles.catalog} id="products" aria-labelledby="products-title">
            <h2 id="products-title" className="visually-hidden">Товари каталогу</h2>

            {collection ? null : (
              <Suspense fallback={null}>
                <CategoryTiles activeSlug={activeCategory} searchParams={searchParams} />
              </Suspense>
            )}

            <Suspense fallback={<ProductGridSkeleton />}>
              <SortedProductList
                searchParams={searchParams}
                category={activeCategory}
                collection={collection}
              />
            </Suspense>
          </section>
        )}
      </div>
    </div>
  );
}

async function CatalogHeading({
  title,
  eyebrow,
  description,
  searchParams,
  nested,
}: Pick<CatalogPageProps, "title" | "eyebrow" | "description" | "searchParams"> & {
  nested: boolean;
}) {
  const query = readSearchQuery((await searchParams).q);

  return (
    <>
      <div className={styles.crumbs}>
        <Breadcrumbs
          trail={query || nested ? [{ href: "/catalog", label: "Каталог" }] : []}
          current={query ? "Результати пошуку" : title}
        />
      </div>
      <header className={`${styles.heading} ${query ? styles.searchHeading : ""}`}>
        <div>
          <p className={styles.eyebrow}>{query ? "Каталог Curly Joy" : eyebrow}</p>
          <h1 id="catalog-title">{query ? "Результати пошуку" : title}</h1>
          {query ? <p className={styles.searchQuery}>За запитом «{query}»</p> : null}
        </div>
        {query ? null : <p className={styles.description}>{description}</p>}
      </header>
    </>
  );
}
