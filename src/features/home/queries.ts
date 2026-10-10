import "server-only";

import {
  getCategories,
  getCollection,
  getProducts,
} from "@/features/catalog/queries";
import type { Category, ProductListItem } from "@/features/catalog/types";

/** CRM collection the merchant curates for «Curly Joy рекомендує». */
export const RECOMMENDATIONS_COLLECTION = "curly-joy-recommends";
const RECOMMENDATIONS_LIMIT = 12;

/**
 * The «Curly Joy рекомендує» shelf: the CRM collection when the merchant has
 * set one up, otherwise the newest products in stock.
 */
export async function getHomeRecommendations(): Promise<{
  products: ProductListItem[];
  catalogHref: "/catalog" | `/catalog?collection=${string}`;
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
        ? `/catalog?collection=${RECOMMENDATIONS_COLLECTION}`
        : "/catalog",
  };
}

export interface HomeCategory extends Category {
  /** The category's own picture, or a product photo from it until one is set. */
  coverUrl: string | null;
}

/** Top-level CRM categories for the «Життя із собакою» tiles. */
export async function getHomeCategories(): Promise<HomeCategory[]> {
  const categories = (await getCategories()).filter(
    (category) => category.parentId === null,
  );

  return Promise.all(
    categories.map(async (category) => {
      if (category.imageUrl)
        return { ...category, coverUrl: category.imageUrl };
      const products = await getProducts({ category: category.slug });
      const cover =
        products.find((product) => product.image.src)?.image.src ?? null;
      return { ...category, coverUrl: cover };
    }),
  );
}
