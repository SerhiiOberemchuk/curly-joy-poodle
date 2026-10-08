import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { cache } from "react";

import { loadCatalog, loadProducts, type Catalog } from "./catalog-source";
import { fetchCollection } from "./crm-api";
import type {
  Category,
  CollectionInfo,
  Product,
  ProductListItem,
  ProductVariant,
} from "./types";

/**
 * Cache tags. The catalog is edited in the CRM, so it is cached briefly
 * (`minutes`: refreshed in the background a minute after it was read) and the
 * tag is there for an on-demand revalidation hook.
 */
export const catalogTags = {
  all: "catalog",
  collection: (slug: string) => `catalog:collection:${slug}`,
} as const;

export interface ProductFilter {
  category?: string;
  collection?: string;
  /** Free-text search: every word must occur in the title, brand or a SKU. */
  query?: string;
}

function normalize(text: string): string {
  return text.toLocaleLowerCase("uk").replace(/[’'ʼ]/g, "'");
}

function matchesQuery(product: Product, query: string): boolean {
  const haystack = normalize(
    [product.title, product.brand ?? "", ...product.variants.map((variant) => variant.sku)].join(" "),
  );
  return normalize(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

/** Cached descriptions, categories and listings; purchase checks bypass this. */
async function getCatalog(): Promise<Catalog> {
  "use cache";
  cacheLife("minutes");
  cacheTag(catalogTags.all);

  return loadCatalog();
}

/** Deduplicated within a render only; never reads the persistent catalog cache. */
export const getCurrentProducts = cache(loadProducts);

async function getCollectionDetail(slug: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(catalogTags.all, catalogTags.collection(slug));

  return fetchCollection(slug);
}

function toListItem(product: Product): ProductListItem {
  const available = product.variants.filter((variant) => variant.inStock);
  const priced = available.length > 0 ? available : product.variants;
  const cheapest = priced.reduce((min, variant) =>
    variant.price < min.price ? variant : min,
  );

  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    brand: product.brand,
    summary: product.summary,
    image: product.images[0],
    priceFrom: cheapest.price,
    compareAtPrice: cheapest.compareAtPrice,
    options: product.variants.length > 1
      ? product.variants.flatMap((variant) => (variant.label ? [variant.label] : []))
      : [],
    inStock: available.length > 0,
  };
}

/** The category and everything nested beneath it. */
function categoryTree(categories: readonly Category[], rootId: string): Set<string> {
  const ids = new Set([rootId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const category of categories) {
      if (category.parentId && ids.has(category.parentId) && !ids.has(category.id)) {
        ids.add(category.id);
        grew = true;
      }
    }
  }
  return ids;
}

export async function getCategories(): Promise<readonly Category[]> {
  return (await getCatalog()).categories;
}

export async function getCategory(slug: string): Promise<Category | null> {
  return (await getCategories()).find((category) => category.slug === slug) ?? null;
}

export async function getCategorySlugs(): Promise<string[]> {
  return (await getCategories()).map((category) => category.slug);
}

/** `null` when the CRM has no such collection, or it is hidden or out of season. */
export async function getCollection(slug: string): Promise<CollectionInfo | null> {
  const collection = await getCollectionDetail(slug);
  if (!collection) return null;

  return {
    slug: collection.slug,
    title: collection.name,
    description: collection.description,
  };
}

/**
 * Products in catalog order (newest first) or, for a collection, in the
 * merchant's order. Display sorting is the client's job — see `sorting.ts`.
 */
export async function getProducts(
  filter: ProductFilter = {},
): Promise<ProductListItem[]> {
  const { products, categories } = await getCatalog();
  let matched: readonly Product[] = products;

  if (filter.category) {
    const category = categories.find((item) => item.slug === filter.category);
    if (!category) return [];
    const ids = categoryTree(categories, category.id);
    matched = matched.filter((product) => product.categoryId && ids.has(product.categoryId));
  }

  const query = filter.query?.trim();
  if (query) matched = matched.filter((product) => matchesQuery(product, query));

  if (filter.collection) {
    const collection = await getCollectionDetail(filter.collection);
    if (!collection) return [];
    // The collection lists CRM products, i.e. variants; keep the merchant's order.
    const position = new Map(collection.products.map((item, index) => [item.id, index]));
    const rank = (product: Product) =>
      Math.min(...product.variants.map((variant) => position.get(variant.id) ?? Infinity));

    return matched
      .filter((product) => rank(product) !== Infinity)
      .sort((a, b) => rank(a) - rank(b))
      .map(toListItem);
  }

  return matched.map(toListItem);
}

/**
 * Resolves a product URL. A slug from before a rename still ends in the
 * product's `urlKey`, so it resolves too; the page redirects it to `slug`.
 */
export async function getProduct(slug: string): Promise<Product | null> {
  const { products } = await getCatalog();
  return resolveProduct(products, slug);
}

export async function getCurrentProduct(slug: string): Promise<Product | null> {
  return resolveProduct(await getCurrentProducts(), slug);
}

function resolveProduct(products: readonly Product[], slug: string): Product | null {
  const exact = products.find((product) => product.slug === slug);
  if (exact) return exact;

  // Longest key wins, so `…-myw-00001` cannot land on a product keyed `00001`.
  const renamed = products
    .filter((product) => slug === product.urlKey || slug.endsWith(`-${product.urlKey}`))
    .sort((a, b) => b.urlKey.length - a.urlKey.length);
  return renamed[0] ?? null;
}

export async function getProductCategory(product: Product): Promise<Category | null> {
  if (!product.categoryId) return null;
  return (await getCategories()).find((category) => category.id === product.categoryId) ?? null;
}

/** Slugs for `generateStaticParams` — prerenders every product at build time. */
export async function getProductSlugs(): Promise<string[]> {
  return (await getCatalog()).products.map((product) => product.slug);
}

/** Same category first, then the rest of the catalog, in stock only. */
export async function getRelatedProducts(
  product: Product,
  limit = 4,
): Promise<ProductListItem[]> {
  const { products } = await getCatalog();
  const others = products
    .filter((candidate) => candidate.id !== product.id)
    .map((candidate) => ({ candidate, item: toListItem(candidate) }))
    .filter(({ item }) => item.inStock);

  const sameCategory = others.filter(
    ({ candidate }) => product.categoryId && candidate.categoryId === product.categoryId,
  );
  const rest = others.filter(({ candidate }) => !sameCategory.some((entry) => entry.candidate === candidate));

  return [...sameCategory, ...rest].slice(0, limit).map(({ item }) => item);
}

/**
 * Resolves a variant from an id that came off the wire (cart cookie, form
 * input). Prices and stock are fetched fresh from the CRM, never from the
 * persistent catalog cache or the client.
 */
export async function findVariant(
  variantId: string,
): Promise<{ product: Product; variant: ProductVariant } | null> {
  const products = await getCurrentProducts();

  for (const product of products) {
    const variant = product.variants.find((item) => item.id === variantId);
    if (variant) return { product, variant };
  }
  return null;
}
