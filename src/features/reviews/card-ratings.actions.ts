"use server";

import { getListedProducts } from "@/features/catalog/queries";

import { getCatalogReviewSummaries } from "./catalog-ratings.server";
import { modelKeyOf, ratingFromSummaries } from "./crm-reviews";

export type CardRating = { average: number; count: number };
export type CardRatingsResult =
  | { ok: true; ratings: Record<string, CardRating> }
  | { ok: false };

/** Published aggregates only: no review authors, email addresses or draft reviews. */
export async function getCardRatingsAction(): Promise<CardRatingsResult> {
  try {
    const [summaries, products] = await Promise.all([
      getCatalogReviewSummaries(),
      getListedProducts(),
    ]);
    if (!summaries) return { ok: false };
    const byKey = new Map(summaries.map((summary) => [summary.modelKey, summary]));
    const ratings: Record<string, CardRating> = {};
    for (const product of products) {
      const summary = byKey.get(modelKeyOf(product.id));
      const rating = summary ? ratingFromSummaries([summary]) : null;
      if (rating) ratings[product.id] = rating;
    }
    return { ok: true, ratings };
  } catch {
    return { ok: false };
  }
}
