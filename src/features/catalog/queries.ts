import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { categories, collections, products, sizeGuide } from "./catalog-source";
import type { SortOption } from "./sorting";
import type {
  Category,
  Collection,
  CollectionInfo,
  Product,
  ProductListItem,
  ProductVariant,
  SizeCode,
  SizeGuideRow,
} from "./types";

/**
 * Cache tags. Mutations that touch the catalog revalidate these, so the tag
 * names live next to the reads that register them.
 */
export const catalogTags = {
  all: "catalog",
  product: (slug: string) => `catalog:product:${slug}`,
  category: (slug: string) => `catalog:category:${slug}`,
} as const;

export interface ProductFilter {
  category?: string;
  collection?: Collection;
  sort?: SortOption;
}

function toListItem(product: Product): ProductListItem {
  const available = product.variants.filter((variant) => variant.stock > 0);
  const priced = available.length > 0 ? available : product.variants;
  const cheapest = priced.reduce((min, variant) =>
    variant.price < min.price ? variant : min,
  );

  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    line: product.line,
    summary: product.summary,
    categorySlug: product.categorySlug,
    badges: product.badges,
    image: product.images[0],
    priceFrom: cheapest.price,
    compareAtPrice: cheapest.compareAtPrice,
    sizes: product.variants.map((variant) => variant.size),
    inStock: available.length > 0,
  };
}

function sortProducts(
  items: ProductListItem[],
  sort: SortOption,
): ProductListItem[] {
  switch (sort) {
    case "newest":
      return items.reverse();
    case "price-asc":
      return items.sort((a, b) => a.priceFrom - b.priceFrom);
    case "price-desc":
      return items.sort((a, b) => b.priceFrom - a.priceFrom);
    case "title":
      return items.sort((a, b) => a.title.localeCompare(b.title, "uk"));
    case "featured":
      // In-stock first, then the seed order, which mirrors merchandising priority.
      return items.sort((a, b) => Number(b.inStock) - Number(a.inStock));
  }
}

export async function getCategories(): Promise<readonly Category[]> {
  "use cache";
  cacheLife("days");
  cacheTag(catalogTags.all);

  return categories;
}

export async function getCategory(slug: string): Promise<Category | null> {
  "use cache";
  cacheLife("days");
  cacheTag(catalogTags.all, catalogTags.category(slug));

  return categories.find((category) => category.slug === slug) ?? null;
}

export async function getCollections(): Promise<readonly CollectionInfo[]> {
  "use cache";
  cacheLife("days");
  cacheTag(catalogTags.all);

  return collections;
}

export async function getCollection(
  slug: string,
): Promise<CollectionInfo | null> {
  "use cache";
  cacheLife("days");
  cacheTag(catalogTags.all);

  return collections.find((collection) => collection.slug === slug) ?? null;
}

export async function getProducts(
  filter: ProductFilter = {},
): Promise<ProductListItem[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(
    catalogTags.all,
    ...(filter.category ? [catalogTags.category(filter.category)] : []),
  );

  const category = filter.category
    ? categories.find((item) => item.slug === filter.category)
    : undefined;
  const collection = filter.collection
    ? collections.find((item) => item.slug === filter.collection)
    : undefined;
  const selection = collection?.productSlugs;

  const matched = products.filter((product) => {
    if (filter.category && !category?.productSlugs.includes(product.slug)) return false;
    if (filter.collection) {
      if (selection) return selection.includes(product.slug);
      return product.collection === filter.collection;
    }
    return true;
  });

  // Preserve the editor's sequence when the customer chooses recommendations.
  if (selection && (!filter.sort || filter.sort === "featured")) {
    matched.sort(
      (a, b) => selection.indexOf(a.slug) - selection.indexOf(b.slug),
    );
  }

  return sortProducts(matched.map(toListItem), filter.sort ?? "featured");
}

export async function getProduct(slug: string): Promise<Product | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(catalogTags.all, catalogTags.product(slug));

  return products.find((product) => product.slug === slug) ?? null;
}

export async function getProductCategory(slug: string): Promise<Category | null> {
  "use cache";
  cacheLife("days");
  cacheTag(catalogTags.all);

  return categories.find((category) => category.productSlugs.includes(slug)) ?? null;
}

/** Slugs for `generateStaticParams` — prerenders every product at build time. */
export async function getProductSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("days");
  cacheTag(catalogTags.all);

  return products.map((product) => product.slug);
}

export async function getCategorySlugs(): Promise<string[]> {
  "use cache";
  cacheLife("days");
  cacheTag(catalogTags.all);

  return categories.map((category) => category.slug);
}

export async function getRelatedProducts(
  slug: string,
  limit = 4,
): Promise<ProductListItem[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(catalogTags.all, catalogTags.product(slug));

  const current = products.find((product) => product.slug === slug);
  if (!current) return [];

  const sameCategory = products.filter(
    (product) =>
      product.slug !== slug && product.categorySlug === current.categorySlug,
  );
  const sameCollection = products.filter(
    (product) =>
      product.slug !== slug &&
      product.categorySlug !== current.categorySlug &&
      product.collection === current.collection,
  );

  return [...sameCategory, ...sameCollection].slice(0, limit).map(toListItem);
}

export async function getSizeGuide(): Promise<readonly SizeGuideRow[]> {
  "use cache";
  cacheLife("max");
  cacheTag(catalogTags.all);

  return sizeGuide;
}

/**
 * Resolves a variant from ids that came off the wire (cart cookie, form input).
 * Prices are always re-read here — never trusted from the client.
 */
export async function findVariant(
  productId: string,
  size: SizeCode,
): Promise<{ product: Product; variant: ProductVariant } | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(catalogTags.all);

  const product = products.find((item) => item.id === productId);
  if (!product) return null;

  const variant = product.variants.find((item) => item.size === size);
  if (!variant) return null;

  return { product, variant };
}
