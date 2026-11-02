import type { ProductListItem } from "./types";

/** Shared by the filter panel and the list it narrows — no `server-only` here. */

/** Six rows of four: a page that loads fast and still feels full. */
export const CATALOG_PAGE_SIZE = 24;

export interface ProductFilters {
  brands: readonly string[];
  /** Whole hryvnia, as the buyer types them; `null` leaves that end open. */
  minPrice: number | null;
  maxPrice: number | null;
  inStockOnly: boolean;
  saleOnly: boolean;
}

export interface FilterFacets {
  brands: ReadonlyArray<{ name: string; count: number }>;
  /** Whole hryvnia, rounded outwards so every price fits inside. */
  priceRange: { min: number; max: number } | null;
  outOfStock: number;
  onSale: number;
}

/** A crossed-out old price above the current one. */
export const onSale = (product: ProductListItem) =>
  product.compareAtPrice !== undefined && product.compareAtPrice > product.priceFrom;

/** What the current list offers to filter by, counted from the products themselves. */
export function filterFacets(products: readonly ProductListItem[]): FilterFacets {
  const brands = new Map<string, number>();
  for (const product of products) {
    if (product.brand) brands.set(product.brand, (brands.get(product.brand) ?? 0) + 1);
  }
  const prices = products.map((product) => product.priceFrom);

  return {
    brands: [...brands]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name, "uk")),
    priceRange: prices.length
      ? {
          min: Math.floor(Math.min(...prices) / 100),
          max: Math.ceil(Math.max(...prices) / 100),
        }
      : null,
    outOfStock: products.filter((product) => !product.inStock).length,
    onSale: products.filter(onSale).length,
  };
}

/**
 * Which sections the filter column shows: only where the products differ.
 * The column and its loading skeleton both follow these rules.
 */
export function filterSections(facets: FilterFacets) {
  return {
    brands: facets.brands.length > 1,
    price: facets.priceRange !== null && facets.priceRange.min < facets.priceRange.max,
    inStock: facets.outOfStock > 0,
    sale: facets.onSale > 0,
  };
}

/** Products that pass every active filter; prices compare in kopiyky. */
export function filterProductList(
  products: readonly ProductListItem[],
  filters: ProductFilters,
): ProductListItem[] {
  const min = filters.minPrice === null ? null : filters.minPrice * 100;
  const max = filters.maxPrice === null ? null : filters.maxPrice * 100;

  return products.filter(
    (product) =>
      (filters.brands.length === 0 ||
        (product.brand !== null && filters.brands.includes(product.brand))) &&
      (min === null || product.priceFrom >= min) &&
      (max === null || product.priceFrom <= max) &&
      (!filters.inStockOnly || product.inStock) &&
      (!filters.saleOnly || onSale(product)),
  );
}

export function activeFilterCount(filters: ProductFilters): number {
  return (
    filters.brands.length +
    Number(filters.minPrice !== null || filters.maxPrice !== null) +
    Number(filters.inStockOnly) +
    Number(filters.saleOnly)
  );
}
