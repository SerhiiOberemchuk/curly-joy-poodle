import "server-only";

import { crmFailureDetails } from "@/lib/crm-errors";

import { onSale } from "./filtering";
import {
  getCategories,
  getCategoryTiles,
  getCollection,
  getCollectionSlugs,
  getProducts,
} from "./queries";

export interface CatalogMenuLink {
  slug: string;
  title: string;
}

export interface CatalogMenuCategory extends CatalogMenuLink {
  /** The category's own picture, or a product photo from it until one is set. */
  coverUrl: string | null;
  /** Its subcategories, when the CRM has them. */
  children: readonly CatalogMenuLink[];
}

export interface CatalogMenu {
  categories: readonly CatalogMenuCategory[];
  /** Collections live in the CRM right now. */
  collections: readonly CatalogMenuLink[];
  /** Some product has an old price above the current one. */
  hasSale: boolean;
}

/**
 * What the header's catalog panel lists, from the cached catalog, so the
 * panel is part of every page's static shell. The header is on every page,
 * error pages included: a failed read leaves the panel with its links to the
 * whole catalog instead of breaking the page.
 */
export async function getCatalogMenu(): Promise<CatalogMenu | null> {
  try {
    const [tiles, categories, products, collectionSlugs] = await Promise.all([
      getCategoryTiles(null),
      getCategories(),
      getProducts(),
      getCollectionSlugs(),
    ]);
    const collections = await Promise.all(collectionSlugs.map((slug) => getCollection(slug)));
    return {
      categories: tiles.map((tile) => ({
        slug: tile.slug,
        title: tile.title,
        coverUrl: tile.coverUrl,
        children: categories
          .filter((category) => category.parentId === tile.id)
          .map((category) => ({ slug: category.slug, title: category.title })),
      })),
      collections: collections.flatMap((collection) =>
        collection ? [{ slug: collection.slug, title: collection.title }] : [],
      ),
      hasSale: products.some(onSale),
    };
  } catch (error) {
    console.error(
      "[catalog-menu] The header's catalog panel lists only the whole catalog: the CRM read failed.",
      crmFailureDetails(error),
    );
    return null;
  }
}
