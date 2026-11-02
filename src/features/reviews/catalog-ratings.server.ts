import "server-only";

import { cacheLife } from "next/cache";

import { getListedProducts } from "@/features/catalog/queries";
import { crmFailureDetails } from "@/lib/crm-errors";
import { CrmApiError } from "@/lib/crm-client";

import { fetchReviewSummaries, modelKeyOf, type ReviewSummary } from "./crm-reviews";

/** One shared, bounded read of published ratings for cards and shop statistics. */
export async function getCatalogReviewSummaries(): Promise<ReviewSummary[] | null> {
  "use cache: remote";
  cacheLife({ stale: 60, revalidate: 60, expire: 120 });
  try {
    const keys = [...new Set((await getListedProducts()).map((product) => modelKeyOf(product.id)))];
    const summaries: ReviewSummary[] = [];
    // The CRM accepts at most 100 model keys per request.
    for (let start = 0; start < keys.length; start += 100) {
      summaries.push(...await fetchReviewSummaries(keys.slice(start, start + 100)));
    }
    return summaries;
  } catch (error) {
    console.error("[reviews] Catalog ratings are hidden: the CRM read failed.", {
      ...crmFailureDetails(error),
      ...(error instanceof CrmApiError && error.status === 403 ? {
        hint: "The site token lacks reviews:read. Add it in the CRM: Налаштування → Інтеграції → API-токени → «Змінити права»; no new key is needed.",
      } : {}),
    });
    return null;
  }
}
