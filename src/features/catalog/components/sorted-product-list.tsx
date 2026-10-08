import { getCollection, getProducts } from "../queries";
import { CatalogResults } from "./catalog-results";

export type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

/**
 * Resolves the server-owned filters. Sorting is intentionally performed by the
 * client so changing it never suspends or reloads the catalog route.
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
  const [params, categorySlug] = await Promise.all([searchParams, category]);
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const requestedCollection = first(params.collection);
  const queryCollection = requestedCollection
    ? await getCollection(requestedCollection)
    : null;
  const activeCollection = collection ?? queryCollection?.slug;
  const query = first(params.q)?.trim().slice(0, 100) || undefined;

  const products = await getProducts({ category: categorySlug, collection: activeCollection, query });

  return <CatalogResults products={products} query={query} />;
}
