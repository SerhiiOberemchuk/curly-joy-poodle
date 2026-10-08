import type { ProductListItem } from "./types";

/** Shared by the server queries and the client sort control — no `server-only` here. */

export type SortOption = "featured" | "newest" | "price-asc" | "price-desc" | "title";

export const sortValues = [
  "featured",
  "newest",
  "price-asc",
  "price-desc",
  "title",
] as const satisfies readonly SortOption[];

export const sortOptions: ReadonlyArray<{ value: SortOption; label: string }> = [
  { value: "featured", label: "Рекомендовані" },
  { value: "newest", label: "Спочатку новинки" },
  { value: "price-asc", label: "Спочатку дешевші" },
  { value: "price-desc", label: "Спочатку дорожчі" },
  { value: "title", label: "За назвою" },
];

export function isSortOption(value: string | undefined): value is SortOption {
  return sortOptions.some((option) => option.value === value);
}

export function sortProductList(
  products: readonly ProductListItem[],
  sort: SortOption,
): ProductListItem[] {
  const items = [...products];

  // `products` arrive in catalog order: newest first, or the merchant's order
  // for a collection.
  switch (sort) {
    case "newest":
      return items;
    case "price-asc":
      return items.sort((a, b) => a.priceFrom - b.priceFrom);
    case "price-desc":
      return items.sort((a, b) => b.priceFrom - a.priceFrom);
    case "title":
      return items.sort((a, b) => a.title.localeCompare(b.title, "uk"));
    case "featured":
      // Stable sort: in-stock first, otherwise the catalog order is kept.
      return items.sort((a, b) => Number(b.inStock) - Number(a.inStock));
  }
}
