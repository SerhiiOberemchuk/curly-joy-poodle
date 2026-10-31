import { Suspense, type ReactNode } from "react";
import { readSearchQuery } from "../search";

import { CategoryChips } from "./category-chips";
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
          />
        </Suspense>

        {children ?? (
          <section className={styles.catalog} id="products" aria-labelledby="products-title">
            <h2 id="products-title" className="visually-hidden">Товари каталогу</h2>

            {activeCategory ? (
              <Suspense fallback={<CategoryChips filtered />}>
                <CategoryChips activeSlug={activeCategory} />
              </Suspense>
            ) : (
              <CategoryChips filtered={Boolean(collection)} />
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
}: Pick<CatalogPageProps, "title" | "eyebrow" | "description" | "searchParams">) {
  const query = readSearchQuery((await searchParams).q);

  return (
    <header className={`${styles.heading} ${query ? styles.searchHeading : ""}`}>
      <div>
        <p className={styles.eyebrow}>{query ? "Каталог Curly Joy" : eyebrow}</p>
        <h1 id="catalog-title">{query ? "Результати пошуку" : title}</h1>
      </div>
      {query ? null : <p className={styles.description}>{description}</p>}
    </header>
  );
}
