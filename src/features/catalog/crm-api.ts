import "server-only";
import { CrmApiError, crmRequest } from "@/lib/crm-client";
export { CrmApiError } from "@/lib/crm-client";

/**
 * Read-only client for the obriym-crm public API (v1). The shop's catalog lives
 * entirely in the client's CRM account; `OBRIYM_CRM_API_KEY` is a token issued
 * in that account and is what binds the shop to it.
 *
 * Only the fields the storefront reads are typed here.
 */

const PAGE_SIZE = 100;
/** 50 pages × 100 — far beyond this shop, low enough to stop a runaway loop. */
const MAX_PAGES = 50;

export interface CrmProduct {
  id: string;
  sku: string | null;
  name: string;
  /** Default price in the workspace currency, major units. */
  price: number;
  compareAtPrice: number | null;
  currency: string;
  prices: { currency: string; price: number; compareAtPrice: number | null }[];
  /** `null` when the CRM does not track this product's stock. */
  stock: number | null;
  /** The merchant's own statement: `in_stock`, `out_of_stock`, … */
  availability: string;
  productGroupId: string | null;
  size: string | null;
  color: string | null;
  /** Plain text with the CRM's light markup (`- ` bullets, `**bold**`, blank-line paragraphs). */
  description: string | null;
  /** `description` rendered by the CRM into p/br/ul/ol/li/strong only. */
  descriptionHtml: string | null;
  attributes: { name: string; unit: string | null; value: string }[];
  images: { url: string; alt: string | null }[];
  brand: { id: string; name: string | null } | null;
  category: { id: string; name: string | null; parentId: string | null } | null;
}

export interface CrmCategory {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
}

export interface CrmCollection {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
}

export interface CrmCollectionDetail extends CrmCollection {
  /** Active products of the collection, in the merchant's order. */
  products: { id: string; name: string; sku: string | null }[];
}

interface Page<T> {
  data: T[];
  pagination: { page: number; perPage: number; total: number };
}

/** Missing records are distinct from an unavailable CRM. */
async function request<T>(path: string): Promise<T | null> {
  try {
    return await crmRequest<T>(path);
  } catch (error) {
    if (error instanceof CrmApiError && error.status === 404) return null;
    throw error;
  }
}

async function requestOrThrow<T>(path: string): Promise<T> {
  const body = await request<T>(path);
  if (body === null) throw new CrmApiError(404, "NOT_FOUND");
  return body;
}

/**
 * Every product the merchant offers on their own site: active and switched on
 * for the storefront (the API's default filters), newest first.
 */
export async function fetchProducts(): Promise<CrmProduct[]> {
  const products: CrmProduct[] = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const body = await requestOrThrow<Page<CrmProduct>>(
      `/products?perPage=${PAGE_SIZE}&page=${page}&sort=newest`,
    );
    products.push(...body.data);
    if (
      body.data.length < PAGE_SIZE ||
      products.length >= body.pagination.total
    )
      break;
  }

  return products;
}

export async function fetchCategories(): Promise<CrmCategory[]> {
  return (await requestOrThrow<{ data: CrmCategory[] }>("/categories")).data;
}

/** Visible, in-season collections. */
export async function fetchCollections(): Promise<CrmCollection[]> {
  return (await requestOrThrow<{ data: CrmCollection[] }>("/collections")).data;
}

/** `null` when the collection does not exist, is hidden or is out of season. */
export async function fetchCollection(
  slug: string,
): Promise<CrmCollectionDetail | null> {
  const body = await request<{ data: CrmCollectionDetail }>(
    `/collections/${encodeURIComponent(slug)}`,
  );
  return body?.data ?? null;
}
