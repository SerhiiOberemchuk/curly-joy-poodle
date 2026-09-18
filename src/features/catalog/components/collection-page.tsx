import Link from "next/link";
import { Suspense } from "react";

import { collectionBrand } from "../collection-content";
import { getCollectionSections } from "../queries";
import { isSortOption } from "../sorting";
import type { CollectionInfo } from "../types";
import { CatalogPage } from "./catalog-page";
import { ProductGrid } from "./product-grid";
import { ProductGridSkeleton } from "./product-grid-skeleton";
import { SortSelect } from "./sort-select";
import type { SearchParams } from "./sorted-product-list";
import styles from "./collection-page.module.css";

export async function CollectionPage({
  collection,
  searchParams,
}: {
  collection: CollectionInfo;
  searchParams: SearchParams;
}) {
  const sections = await getCollectionSections(collection.slug);

  return (
    <CatalogPage
      eyebrow="Колекція Curly Joy"
      title={collection.title}
      tagline={collection.tagline}
      description={collection.description}
      searchParams={searchParams}
    >
      <section className={styles.brand} id="products" aria-labelledby="brand-title">
        <p className={styles.eyebrow}>{collectionBrand.name} · обрано Curly Joy</p>
        <h2 id="brand-title">{collectionBrand.title}</h2>
        <p>{collectionBrand.description}</p>
        <p className={styles.collectionIntro}>{collection.description}</p>
        {sections.length ? (
          <nav className={styles.navigation} aria-label="Групи товарів колекції">
            {sections.map((section) => (
              <a href={`#group-${section.slug}`} key={section.slug}>
                {section.title}<span aria-hidden="true">↓</span>
              </a>
            ))}
          </nav>
        ) : null}
      </section>

      <Suspense fallback={<div className={styles.loading}><ProductGridSkeleton /></div>}>
        <CollectionSections collection={collection} searchParams={searchParams} />
      </Suspense>

      <aside className={styles.help}>
        <div>
          <h2>Щоб сиділо як треба</h2>
          <p>Для одягу й амуніції важливі заміри, а не лише порода. Допоможемо розібратися.</p>
        </div>
        <Link href="/info/sizes">Як виміряти собаку <span aria-hidden="true">↗</span></Link>
      </aside>
    </CatalogPage>
  );
}

async function CollectionSections({
  collection,
  searchParams,
}: {
  collection: CollectionInfo;
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const requested = Array.isArray(params.sort) ? params.sort[0] : params.sort;
  const sort = isSortOption(requested) ? requested : "featured";
  const sections = await getCollectionSections(collection.slug, sort);

  if (!sections.length) {
    return <div className={styles.loading}><ProductGrid products={[]} /></div>;
  }

  return (
    <div className={styles.groups}>
      <div className={styles.toolbar}>
        <p>Знайдіть свою улюблену річ</p>
        <SortSelect value={sort} />
      </div>
      {sections.map((section, index) => (
        <section
          className={styles.group}
          key={section.slug}
          id={`group-${section.slug}`}
          aria-labelledby={`title-${section.slug}`}
        >
          <header className={styles.groupIntro}>
            <span className={styles.number} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <h2 id={`title-${section.slug}`}>{section.title}</h2>
            <p>{section.description}</p>
          </header>
          <div className={styles.products}><ProductGrid products={section.products} /></div>
        </section>
      ))}
    </div>
  );
}
