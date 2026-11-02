"use client";

import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { useMemo, useRef, useState } from "react";

import { Icon } from "@/components/ui/icon";
import { Bone } from "@/components/ui/skeleton";

import {
  CATALOG_PAGE_SIZE,
  filterFacets,
  filterProductList,
  type ProductFilters,
} from "../filtering";
import { defaultSort, sortProductList, sortValues } from "../sorting";
import type { ProductListItem } from "../types";
import { CatalogFilters, type CategoryLink } from "./catalog-filters";
import styles from "./catalog-toolbar.module.css";
import type { ProductCardShape } from "./product-card";
import { ProductGrid, ProductGridSkeleton } from "./product-grid";
import { SortSelect } from "./sort-select";

/** The rows the filter column will hold, counted from the cached list. */
export interface FilterOutline {
  /** Category links, «Усі товари» included. */
  categories: number;
  /** Brand checkboxes; 0 when the section is hidden. */
  brands: number;
  price: boolean;
  /** «Лише в наявності» and «Зі знижкою», as shown. */
  checks: number;
}

function RowBones({ count, className }: { count: number; className: string }) {
  return Array.from({ length: count }, (_, index) => (
    <span className={className} key={index}>
      <Bone line className={styles.rowBone} />
    </span>
  ));
}

function TitleBone() {
  return <Bone line className={styles.filterTitleBone} />;
}

/**
 * The list's layout while it streams: the filter column with its sections,
 * the toolbar, one card per product of the first page (`shapes`) and the
 * pager when the list runs past it. The same elements and classes as the
 * list, so nothing moves on arrival.
 */
export function CatalogResultsSkeleton({
  shapes,
  paged,
  filters,
}: {
  shapes: readonly ProductCardShape[];
  paged: boolean;
  filters: FilterOutline;
}) {
  return (
    <div className={styles.layout}>
      <p className="visually-hidden" role="status">
        Завантажуємо товари…
      </p>
      <div className={styles.filters} aria-hidden="true">
        <Bone className={styles.filtersToggleBone} />
        <div className={styles.filtersPanel}>
          <div className={styles.filterGroup}>
            <p className={styles.filterTitle}>
              <TitleBone />
            </p>
            <div className={styles.categoryList}>
              <RowBones count={filters.categories} className={styles.category} />
            </div>
          </div>
          {filters.brands > 0 ? (
            <fieldset className={styles.filterGroup} disabled>
              <legend className={styles.filterTitle}>
                <TitleBone />
              </legend>
              <RowBones count={filters.brands} className={styles.check} />
            </fieldset>
          ) : null}
          {filters.price ? (
            <div className={styles.filterGroup}>
              <fieldset disabled>
                <legend className={styles.filterTitle}>
                  <TitleBone />
                </legend>
                <div className={styles.priceRow}>
                  <Bone className={styles.priceFieldBone} />
                </div>
              </fieldset>
            </div>
          ) : null}
          {filters.checks > 0 ? (
            <fieldset className={styles.filterGroup} disabled>
              <legend className={styles.filterTitle}>
                <TitleBone />
              </legend>
              <RowBones count={filters.checks} className={styles.check} />
            </fieldset>
          ) : null}
        </div>
      </div>
      <div className={styles.results} aria-hidden="true">
        <div className={styles.toolbar}>
          <Bone line className={`${styles.count} ${styles.countBone}`} />
          <Bone className={styles.sortBone} />
        </div>
        {shapes.length > 0 ? <ProductGridSkeleton cards={shapes} /> : null}
        {paged ? (
          <div className={styles.pagination}>
            <Bone className={styles.moreBone} />
            <Bone className={styles.pagesBone} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

const urlOptions = { history: "replace", shallow: true } as const;
const filterParsers = {
  brand: parseAsArrayOf(parseAsString).withDefault([]),
  from: parseAsInteger,
  to: parseAsInteger,
  stock: parseAsBoolean.withDefault(false),
  sale: parseAsBoolean.withDefault(false),
  page: parseAsInteger.withDefault(1),
};

function pluralize(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "товар";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "товари";
  return "товарів";
}

/**
 * Filters, sorting and pages of the catalog list. All of it lives in the URL
 * (shareable, survives Back) and runs on the products already on the page, so
 * narrowing the list never waits for the server.
 */
export function CatalogResults({
  products,
  query,
  categories = [],
}: {
  products: readonly ProductListItem[];
  /** The search the list answers, if any. */
  query?: string;
  categories?: readonly CategoryLink[];
}) {
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsStringLiteral(sortValues).withDefault(defaultSort).withOptions(urlOptions),
  );
  const [state, setState] = useQueryStates(filterParsers, urlOptions);
  const filters = useMemo<ProductFilters>(
    () => ({
      brands: state.brand,
      minPrice: state.from,
      maxPrice: state.to,
      inStockOnly: state.stock,
      saleOnly: state.sale,
    }),
    [state.brand, state.from, state.to, state.stock, state.sale],
  );
  const facets = useMemo(() => filterFacets(products), [products]);
  const visible = useMemo(
    () => sortProductList(filterProductList(products, filters), sort),
    [products, filters, sort],
  );

  const pages = Math.max(1, Math.ceil(visible.length / CATALOG_PAGE_SIZE));
  const page = Math.min(Math.max(1, state.page), pages);
  // «Show more» extends the run of pages on screen; a page number starts a new run.
  const [runStart, setRunStart] = useState(page);
  const first = Math.min(runStart, page);
  const shown = visible.slice((first - 1) * CATALOG_PAGE_SIZE, page * CATALOG_PAGE_SIZE);
  const resultsRef = useRef<HTMLDivElement>(null);

  function changeFilters(next: Partial<ProductFilters>) {
    setRunStart(1);
    void setState({
      ...(next.brands && { brand: next.brands.length ? [...next.brands] : null }),
      ...("minPrice" in next && { from: next.minPrice }),
      ...("maxPrice" in next && { to: next.maxPrice }),
      ...(next.inStockOnly !== undefined && { stock: next.inStockOnly || null }),
      ...(next.saleOnly !== undefined && { sale: next.saleOnly || null }),
      page: null,
    });
  }

  function goToPage(next: number) {
    setRunStart(next);
    void setState({ page: next === 1 ? null : next });
    resultsRef.current?.scrollIntoView({ block: "start" });
  }

  return (
    <div className={styles.layout}>
      <CatalogFilters
        facets={facets}
        filters={filters}
        categories={categories}
        onChange={changeFilters}
        onReset={() =>
          changeFilters({
            brands: [],
            minPrice: null,
            maxPrice: null,
            inStockOnly: false,
            saleOnly: false,
          })
        }
      />

      <div className={styles.results} ref={resultsRef}>
        <div className={styles.toolbar}>
          <p className={styles.count} role="status">
            {visible.length} {pluralize(visible.length)}
          </p>
          <SortSelect
            value={sort}
            onChange={(value) => {
              setRunStart(1);
              void setSort(value);
              void setState({ page: null });
            }}
          />
        </div>
        <ProductGrid
          products={shown}
          emptyMessage={
            visible.length === 0 && products.length > 0
              ? "За цими фільтрами товарів немає. Змініть умови або скиньте фільтри."
              : query
                ? `За запитом «${query}» нічого не знайшлося. Спробуйте інше слово або перегляньте весь каталог.`
                : undefined
          }
        />

        {pages > 1 ? (
          <nav className={styles.pagination} aria-label="Сторінки каталогу">
            {page < pages ? (
              <button
                type="button"
                className={styles.more}
                onClick={() => void setState({ page: page + 1 })}
              >
                Показати ще {Math.min(CATALOG_PAGE_SIZE, visible.length - page * CATALOG_PAGE_SIZE)}
              </button>
            ) : null}
            <ul className={styles.pages}>
              <li>
                <button
                  type="button"
                  className={styles.pageStep}
                  disabled={first === 1}
                  aria-label="Попередня сторінка"
                  onClick={() => goToPage(first - 1)}
                >
                  <Icon name="chevronLeft" />
                </button>
              </li>
              {Array.from({ length: pages }, (_, index) => index + 1).map((number) => (
                <li key={number}>
                  <button
                    type="button"
                    className={number >= first && number <= page ? styles.pageActive : styles.page}
                    aria-current={number === page ? "page" : undefined}
                    onClick={() => goToPage(number)}
                  >
                    {number}
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  className={styles.pageStep}
                  disabled={page === pages}
                  aria-label="Наступна сторінка"
                  onClick={() => goToPage(page + 1)}
                >
                  <Icon name="chevronRight" />
                </button>
              </li>
            </ul>
          </nav>
        ) : null}
      </div>
    </div>
  );
}
