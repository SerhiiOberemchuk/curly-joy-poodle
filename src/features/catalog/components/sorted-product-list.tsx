import { getCollection, getProducts } from "../queries";
import type { Collection } from "../types";
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
  category?: string;
  collection?: Collection;
}) {
  const params = await searchParams;
  const requestedCollection = Array.isArray(params.collection)
    ? params.collection[0]
    : params.collection;
  const queryCollection = requestedCollection
    ? await getCollection(requestedCollection)
    : null;
  const activeCollection = collection ?? queryCollection?.slug;

  const products = await getProducts({ category, collection: activeCollection });

  return <CatalogResults products={products} />;
}
