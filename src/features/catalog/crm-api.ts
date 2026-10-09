import "server-only";
import { z } from "zod";
import { CrmApiError, crmRequest } from "@/lib/crm-client";
import { crmCategorySchema, crmCollectionDetailSchema, crmCollectionSchema, crmProductsPageSchema, type CrmProduct } from "./crm.types";

export { CrmApiError } from "@/lib/crm-client";
export type { CrmProduct, CrmCategory, CrmCollection, CrmCollectionDetail } from "./crm.types";

const PAGE_SIZE = 100;
const MAX_PAGES = 50;

/** Only a missing resource becomes null; malformed responses and outages propagate. */
async function request<T>(path: string, schema: z.ZodType<T>): Promise<T | null> {
  try {
    return schema.parse(await crmRequest(path));
  } catch (error) {
    if (error instanceof CrmApiError && error.status === 404) return null;
    throw error;
  }
}
async function requestOrThrow<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const body = await request(path, schema);
  if (body === null) throw new CrmApiError(404, "NOT_FOUND");
  return body;
}

/** All active, published products; incomplete pagination must never look like a complete catalog. */
export async function fetchProducts(): Promise<CrmProduct[]> {
  const products: CrmProduct[] = [];
  let received = 0;
  for (let page = 1; page <= MAX_PAGES; page++) {
    const body = await requestOrThrow(`/products?perPage=${PAGE_SIZE}&page=${page}&sort=newest`, crmProductsPageSchema);
    if (body.pagination.page !== page) throw new CrmApiError(502, "INVALID_PAGINATION");
    received += body.data.length;
    products.push(...body.data.filter((item) => item.status === "active" && item.storefrontVisible));
    if (received >= body.pagination.total) return products;
    if (!body.data.length) throw new CrmApiError(502, "INCOMPLETE_CATALOG");
  }
  throw new CrmApiError(502, "CATALOG_PAGE_LIMIT");
}

export async function fetchCategories() {
  return (await requestOrThrow("/categories", z.object({ data: z.array(crmCategorySchema) }))).data;
}
export async function fetchCollections() {
  return (await requestOrThrow("/collections", z.object({ data: z.array(crmCollectionSchema) }))).data;
}
export async function fetchCollection(slug: string) {
  const body = await request(`/collections/${encodeURIComponent(slug)}`, z.object({ data: crmCollectionDetailSchema }));
  return body?.data ?? null;
}