/** Shared by the server queries and the client sort control — no `server-only` here. */

export type SortOption = "featured" | "price-asc" | "price-desc" | "title";

export const sortOptions: ReadonlyArray<{ value: SortOption; label: string }> = [
  { value: "featured", label: "Рекомендовані" },
  { value: "price-asc", label: "Спочатку дешевші" },
  { value: "price-desc", label: "Спочатку дорожчі" },
  { value: "title", label: "За назвою" },
];

export function isSortOption(value: string | undefined): value is SortOption {
  return sortOptions.some((option) => option.value === value);
}
