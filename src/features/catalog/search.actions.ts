"use server";

import { z } from "zod";

import { getProducts } from "./queries";
import type { ProductListItem } from "./types";

const querySchema = z.string().trim().min(2).max(100);
/** As many as fit the header dropdown; the rest is one click away. */
const SUGGESTION_LIMIT = 5;

export type SearchSuggestion = Pick<
  ProductListItem,
  "id" | "slug" | "title" | "image" | "priceFrom" | "compareAtPrice"
> & { priced: "from" | "exact" };

export type SearchSuggestionsResult =
  | { ok: true; total: number; items: SearchSuggestion[] }
  | { ok: false; error: string };

/**
 * Quick results for the header search, from the same cached CRM catalog and
 * matching as the catalog's own search, so «show all» lists the same items.
 */
export async function searchSuggestionsAction(
  query: string,
): Promise<SearchSuggestionsResult> {
  const parsed = querySchema.safeParse(query);
  if (!parsed.success)
    return { ok: false, error: "Введіть щонайменше 2 символи." };
  try {
    const products = await getProducts({ query: parsed.data });
    return {
      ok: true,
      total: products.length,
      items: products.slice(0, SUGGESTION_LIMIT).map((product) => ({
        id: product.id,
        slug: product.slug,
        title: product.title,
        image: product.image,
        priceFrom: product.priceFrom,
        compareAtPrice: product.compareAtPrice,
        priced: new Set(product.options).size > 1 ? "from" : "exact",
      })),
    };
  } catch {
    return { ok: false, error: "Не вдалося виконати пошук. Спробуйте ще раз." };
  }
}
