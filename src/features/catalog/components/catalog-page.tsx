import Image from "next/image";
import { Suspense } from "react";

import type { Accent, Collection } from "../types";
import { CategoryChips } from "./category-chips";
import { ProductGridSkeleton } from "./product-grid-skeleton";
import {
  SortedProductList,
  type SearchParams,
} from "./sorted-product-list";
import styles from "./catalog-page.module.css";

interface CatalogPageProps {
  title: string;
  eyebrow: string;
  tagline: string;
  description: string;
  searchParams: SearchParams;
  activeCategory?: string;
  collection?: Collection;
  accent?: Accent;
}

export function CatalogPage({
  title,
  eyebrow,
  tagline,
  description,
  searchParams,
  activeCategory,
  collection,
  accent = "accent",
}: CatalogPageProps) {
  return (
    <div className={`${styles.page} ${styles[accent]}`}>
      <section className={styles.hero} aria-labelledby="catalog-title">
        <Image
          src="/images/reference/8c922cf1-57f1-44c3-812b-073416497db8.webp"
          alt="Два пуделі Curly Joy"
          fill
          priority
          sizes="(min-width: 1600px) 1600px, 100vw"
          className={styles.heroImage}
        />
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 id="catalog-title">{title}</h1>
          <p className={styles.tagline}>{tagline}</p>
          <a className={styles.heroButton} href="#products">
            Дивитися товари <span aria-hidden="true">↓</span>
          </a>
        </div>
        <span className={styles.heroNote} lang="en">
          Made for
          <br />
          happy walks <b>♡</b>
        </span>
      </section>

      <section className={styles.catalog} id="products" aria-labelledby="products-title">
        <header className={styles.intro}>
          <div>
            <p className={styles.kicker}>Curly Joy edit</p>
            <h2 id="products-title">Речі, які ми обрали</h2>
          </div>
          <p>{description}</p>
        </header>

        <CategoryChips activeSlug={activeCategory} />

        <Suspense fallback={<ProductGridSkeleton />}>
          <SortedProductList
            searchParams={searchParams}
            category={activeCategory}
            collection={collection}
          />
        </Suspense>
      </section>
    </div>
  );
}
