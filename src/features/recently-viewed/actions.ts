"use server";

import { z } from "zod";

import { getProducts } from "@/features/catalog/queries";
import type { ProductListItem } from "@/features/catalog/types";

import { VIEWED_PRODUCTS_LIMIT, viewedProductIdSchema } from "./contract";

const requestSchema = z.array(viewedProductIdSchema).max(VIEWED_PRODUCTS_LIMIT);
export type ViewedProductsResult = { ok: true; items: ProductListItem[] } | { ok: false };

/** Resolve a bounded history against today's published catalog, never a saved product snapshot. */
export async function getViewedProductsAction(ids: readonly string[]): Promise<ViewedProductsResult> {
  const parsed = requestSchema.safeParse(ids);
  if (!parsed.success) return { ok: false };
  if (parsed.data.length === 0) return { ok: true, items: [] };
  try {
    const byId = new Map((await getProducts()).map((product) => [product.id, product]));
    return {
      ok: true,
      items: [...new Set(parsed.data)].flatMap((id) => {
        const product = byId.get(id);
        return product ? [product] : [];
      }),
    };
  } catch {
    return { ok: false };
  }
}
