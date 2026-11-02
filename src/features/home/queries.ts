import "server-only";

import {
  getCategoryTiles,
  getCollection,
  getProducts,
  type CategoryTile,
} from "@/features/catalog/queries";
import type { ProductListItem } from "@/features/catalog/types";

/** CRM collection the merchant curates for «Curly Joy рекомендує». */
export const RECOMMENDATIONS_COLLECTION = "curly-joy-recommends";
/** Four rows of five on a wide screen: enough to browse without leaving home. */
const RECOMMENDATIONS_LIMIT = 20;

/**
 * The «Curly Joy рекомендує» shelf: the CRM collection when the merchant has
 * set one up, otherwise the newest products in stock.
 */
export async function getHomeRecommendations(): Promise<{
  products: ProductListItem[];
  catalogHref: "/catalog" | `/collection/${typeof RECOMMENDATIONS_COLLECTION}`;
}> {
  const curated = (await getCollection(RECOMMENDATIONS_COLLECTION))
    ? await getProducts({ collection: RECOMMENDATIONS_COLLECTION })
    : [];
  const products = curated.length > 0 ? curated : await getProducts();

  return {
    products: products
      .filter((product) => product.inStock)
      .slice(0, RECOMMENDATIONS_LIMIT),
    catalogHref:
      curated.length > 0
        ? `/collection/${RECOMMENDATIONS_COLLECTION}`
        : "/catalog",
  };
}

/** Top-level CRM categories for the «Життя із собакою» tiles. */
export async function getHomeCategories(): Promise<CategoryTile[]> {
  return getCategoryTiles(null);
}
