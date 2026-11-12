import Link from "next/link";
import { cache, Suspense } from "react";

import { Bone } from "@/components/ui/skeleton";

import { CATALOG_PAGE_SIZE, filterFacets } from "../filtering";
import { getCategories, getCollection, getProducts } from "../queries";
import { readSearchQuery } from "../search";
import { defaultSort, sortProductList } from "../sorting";
import type { Category } from "../types";
import { CatalogFilterPanel } from "./catalog-filter-panel";
import type { CategoryLink } from "./catalog-filters";
import {
  CatalogFilterControls,
  CatalogFilterCount,
  CatalogFiltersSkeleton,
  CatalogResults,
  CatalogResultsSkeleton,
} from "./catalog-results";
import { cardShape } from "./product-card";
import styles from "./catalog-toolbar.module.css";

export type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;
interface ListingProps {
  searchParams: SearchParams;
  category?: string;
  collection?: string;
}

const readListing = cache(async (searchParams: SearchParams, category?: string, collection?: string) => {
  const params = await searchParams;
  const requested = Array.isArray(params.collection) ? params.collection[0] : params.collection;
  const activeCollection = collection ?? (requested ? (await getCollection(requested))?.slug : undefined);
  const query = readSearchQuery(params.q);
  return { products: await getProducts({ category, collection: activeCollection, query }), query };
});

function rootOf(categories: readonly Category[], category: Category): Category {
  let current = category;
  const seen = new Set<string>();
  while (current.parentId && !seen.has(current.id)) {
    seen.add(current.id);
    const parent = categories.find((item) => item.id === current.parentId);
    if (!parent) break;
    current = parent;
  }
  return current;
}

async function CategoryLinks({ category, collection }: Pick<ListingProps, "category" | "collection">) {
  const categories = await getCategories();
  const active = categories.find((item) => item.slug === category);
  const activeRoot = active ? rootOf(categories, active).id : null;
  const links: CategoryLink[] = [
    { href: "/catalog", title: "Усі товари", active: !active && !collection },
    ...categories.filter((item) => item.parentId === null).map((item) => ({
      href: `/catalog/${item.slug}` as const,
      title: item.title,
      active: item.id === activeRoot,
    })),
  ];
  return (
    <nav className={styles.filterGroup} aria-label="Категорії">
      <p className={styles.filterTitle}>Категорії</p>
      <ul className={styles.categoryList}>
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={link.active ? styles.categoryActive : styles.category} aria-current={link.active ? "page" : undefined}>
              {link.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

async function Filters({ searchParams, category, collection }: ListingProps) {
  const { products } = await readListing(searchParams, category, collection);
  return <CatalogFilterControls facets={filterFacets(products)} />;
}

async function Results({ searchParams, category, collection }: ListingProps) {
  const listing = await readListing(searchParams, category, collection);
  return <CatalogResults {...listing} />;
}

async function FiltersSkeleton({ category, collection }: Pick<ListingProps, "category" | "collection">) {
  const products = await getProducts({ category, collection }).catch(() => []);
  return <CatalogFiltersSkeleton facets={filterFacets(products)} />;
}

async function ResultsSkeleton({ category, collection }: Pick<ListingProps, "category" | "collection">) {
  const products = sortProductList(await getProducts({ category, collection }).catch(() => []), defaultSort);
  return <CatalogResultsSkeleton shapes={products.slice(0, CATALOG_PAGE_SIZE).map(cardShape)} paged={products.length > CATALOG_PAGE_SIZE} />;
}

/** Cached navigation is in the shell; URL-dependent filters and results stream independently. */
export function CatalogListing(props: ListingProps) {
  return (
    <div className={styles.layout}>
      <CatalogFilterPanel count={
        <Suspense fallback={<Bone line className={styles.filterCountBone} />}>
          <CatalogFilterCount />
        </Suspense>
      }>
        <CategoryLinks category={props.category} collection={props.collection} />
        <Suspense fallback={<FiltersSkeleton category={props.category} collection={props.collection} />}>
          <Filters {...props} />
        </Suspense>
      </CatalogFilterPanel>
      <Suspense fallback={<ResultsSkeleton category={props.category} collection={props.collection} />}>
        <Results {...props} />
      </Suspense>
    </div>
  );
}
