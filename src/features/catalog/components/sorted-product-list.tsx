import { getCategories, getCollection, getProducts } from "../queries";
import { readSearchQuery } from "../search";
import type { Category } from "../types";
import { CatalogResults } from "./catalog-results";
import type { CategoryLink } from "./catalog-filters";

export type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

/** The top-level category a category belongs to (itself, at the top). */
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

/**
 * Resolves the server-owned filters. Sorting and the filter panel run in the
 * client, so changing them never suspends or reloads the catalog route.
 */
export async function SortedProductList({
  searchParams,
  category,
  collection,
}: {
  searchParams: SearchParams;
  category?: Promise<string>;
  collection?: string;
}) {
  const [params, categorySlug, categories] = await Promise.all([
    searchParams,
    category,
    getCategories(),
  ]);
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const requestedCollection = first(params.collection);
  const queryCollection = requestedCollection
    ? await getCollection(requestedCollection)
    : null;
  const activeCollection = collection ?? queryCollection?.slug;
  const query = readSearchQuery(params.q);

  const products = await getProducts({ category: categorySlug, collection: activeCollection, query });

  const active = categories.find((item) => item.slug === categorySlug);
  const activeRoot = active ? rootOf(categories, active).id : null;
  const categoryLinks: CategoryLink[] = [
    { href: "/catalog", title: "Усі товари", active: !active && !activeCollection && !query },
    ...categories
      .filter((item) => item.parentId === null)
      .map((item) => ({
        href: `/catalog/${item.slug}` as const,
        title: item.title,
        active: item.id === activeRoot,
      })),
  ];

  return <CatalogResults products={products} query={query} categories={categoryLinks} />;
}
