"use client";

import { useSearchParams } from "next/navigation";
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { Suspense, useMemo, useRef, useState } from "react";

import { Icon } from "@/components/ui/icon";
import { Bone } from "@/components/ui/skeleton";

import {
  CATALOG_PAGE_SIZE,
  activeFilterCount,
  filterProductList,
  filterSections,
  type FilterFacets,
  type ProductFilters,
} from "../filtering";
import { readSearchQuery } from "../search";
import { defaultSort, sortProductList, sortValues } from "../sorting";
import type { ProductListItem } from "../types";
import { CatalogFilters } from "./catalog-filters";
import styles from "./catalog-toolbar.module.css";
import type { ProductCardShape } from "./product-card";
import { ProductGrid, ProductGridSkeleton } from "./product-grid";
import { SortSelect } from "./sort-select";

export function CatalogFiltersSkeleton({ facets }: { facets: FilterFacets }) {
  const sections = filterSections(facets);
  return (
    <>
      <p className="visually-hidden" role="status">Завантажуємо фільтри…</p>
      {sections.brands ? (
        <fieldset className={styles.filterGroup} disabled>
          <legend className={styles.filterTitle}>Бренд</legend>
          {facets.brands.map((brand) => (
            <span className={styles.check} key={brand.name}><Bone line className={styles.rowBone} /></span>
          ))}
        </fieldset>
      ) : null}
      {sections.price ? (
        <div className={styles.filterGroup}>
          <fieldset disabled>
            <legend className={styles.filterTitle}>Ціна, ₴</legend>
            <div className={styles.priceRow}><Bone className={styles.priceFieldBone} /></div>
          </fieldset>
        </div>
      ) : null}
      {sections.inStock || sections.sale ? (
        <fieldset className={styles.filterGroup} disabled>
          <legend className={styles.filterTitle}>Наявність і ціни</legend>
          {sections.inStock ? <span className={styles.check}><Bone className={styles.checkBone} />Лише в наявності</span> : null}
          {sections.sale ? <span className={styles.check}><Bone className={styles.checkBone} />Зі знижкою</span> : null}
        </fieldset>
      ) : null}
    </>
  );
}

interface ResultsOutline {
  shapes: readonly ProductCardShape[];
  paged: boolean;
}

function ResultsPlaceholder({ shapes, paged, compact = false }: ResultsOutline & { compact?: boolean }) {
  return (
    <div className={styles.results}>
      <p className="visually-hidden" role="status">Завантажуємо товари…</p>
      <div className={styles.toolbar}>
        <Bone line className={`${styles.count} ${styles.countBone}`} />
        <div className={styles.loadingSort}>Сортування <Bone className={styles.sortBone} /></div>
      </div>
      {shapes.length > 0 ? <ProductGridSkeleton cards={shapes} singleRow={compact} /> : null}
      {paged && !compact ? (
        <div className={styles.pagination} aria-hidden="true">
          <Bone className={styles.moreBone} />
          <Bone className={styles.pagesBone} />
        </div>
      ) : null}
    </div>
  );
}

function UrlResultsPlaceholder(props: ResultsOutline) {
  // The shared shell cannot know a search's size. Once the browser knows the
  // URL, reserve one responsive row rather than six rows of unrelated cards.
  const query = readSearchQuery(useSearchParams().get("q") ?? undefined);
  return <ResultsPlaceholder {...props} compact={Boolean(query)} />;
}

export function CatalogResultsSkeleton(props: ResultsOutline) {
  return (
    <Suspense fallback={<ResultsPlaceholder {...props} />}>
      <UrlResultsPlaceholder {...props} />
    </Suspense>
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

/** Both regions read the same URL state through nuqs; no mirrored filter store. */
function useCatalogFilters() {
  const [state, setState] = useQueryStates(filterParsers, urlOptions);
  const filters = useMemo<ProductFilters>(() => ({
    brands: state.brand,
    minPrice: state.from,
    maxPrice: state.to,
    inStockOnly: state.stock,
    saleOnly: state.sale,
  }), [state.brand, state.from, state.to, state.stock, state.sale]);

  function changeFilters(next: Partial<ProductFilters>) {
    void setState({
      ...(next.brands && { brand: next.brands.length ? [...next.brands] : null }),
      ...("minPrice" in next && { from: next.minPrice }),
      ...("maxPrice" in next && { to: next.maxPrice }),
      ...(next.inStockOnly !== undefined && { stock: next.inStockOnly || null }),
      ...(next.saleOnly !== undefined && { sale: next.saleOnly || null }),
      page: null,
    });
  }

  return { state, setState, filters, changeFilters };
}

export function CatalogFilterCount() {
  const { filters } = useCatalogFilters();
  const active = activeFilterCount(filters);
  return active ? ` (${active})` : null;
}

export function CatalogFilterControls({ facets }: { facets: FilterFacets }) {
  const { filters, changeFilters } = useCatalogFilters();
  return (
    <CatalogFilters
      facets={facets}
      filters={filters}
      onChange={changeFilters}
      onReset={() => changeFilters({ brands: [], minPrice: null, maxPrice: null, inStockOnly: false, saleOnly: false })}
    />
  );
}

/**
 * Filters, sorting and pages of the catalog list. All of it lives in the URL
 * (shareable, survives Back) and runs on the products already on the page, so
 * narrowing the list never waits for the server.
 */
export function CatalogResults({
  products,
  query,
}: {
  products: readonly ProductListItem[];
  /** The search the list answers, if any. */
  query?: string;
}) {
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsStringLiteral(sortValues).withDefault(defaultSort).withOptions(urlOptions),
  );
  const { state, setState, filters } = useCatalogFilters();
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

  function goToPage(next: number) {
    setRunStart(next);
    void setState({ page: next === 1 ? null : next });
    resultsRef.current?.scrollIntoView({ block: "start" });
  }

  return (
    <div className={styles.results} ref={resultsRef}>
        <div className={styles.toolbar}>
          <p className={styles.count} role="status">
            {visible.length} {pluralize(visible.length)}
          </p>
          <SortSelect
            value={sort}
            onChange={(value) => {
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
                onClick={() => {
                  // A filter in the other region may have reset the page.
                  // Extend the range that is on screen now, not an older run.
                  setRunStart(first);
                  void setState({ page: page + 1 });
                }}
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
  );
}
