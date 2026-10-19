import "server-only";

import { z } from "zod";
import { cacheLife } from "next/cache";
import { crmRequest } from "@/lib/crm-client";

const reviewSchema = z.object({
  id: z.string(),
  authorName: z.string(),
  body: z.string().nullable(),
  title: z.string().nullable(),
  rating: z.number().int().min(1).max(5),
  verifiedPurchase: z.boolean(),
  submittedAt: z.iso.datetime({ offset: true }),
  reply: z.object({ body: z.string() }).nullable(),
  status: z.literal("published"),
  modelKey: z.string(),
  product: z.object({ id: z.string(), name: z.string() }),
});

export const reviewListSchema = z.object({
  data: z.array(reviewSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    perPage: z.number().int().positive(),
    total: z.number().int().nonnegative(),
  }),
});

const summarySchema = z.object({
  data: z.array(z.object({
    modelKey: z.string(),
    average: z.number().min(1).max(5).nullable(),
    count: z.number().int().nonnegative(),
    distribution: z.object({
      "1": z.number().int().nonnegative(),
      "2": z.number().int().nonnegative(),
      "3": z.number().int().nonnegative(),
      "4": z.number().int().nonnegative(),
      "5": z.number().int().nonnegative(),
    }),
  })),
});

export type PublishedReview = z.infer<typeof reviewSchema>;
export type ReviewSummary = z.infer<typeof summarySchema>["data"][number];

/** The CRM's model key for a storefront product: its group, else the product itself. */
export function modelKeyOf(productId: string): string {
  return productId.startsWith("group:") ? productId.slice(6) : productId;
}

export const REVIEWS_PER_PAGE = 20;

const STARS = ["1", "2", "3", "4", "5"] as const;

/** Exact average over published reviews: the per-model `average` is rounded. */
export function ratingFromSummaries(
  summaries: readonly ReviewSummary[],
): { average: number; count: number } | null {
  let count = 0;
  let stars = 0;
  for (const { distribution } of summaries)
    for (const star of STARS) {
      count += distribution[star];
      stars += Number(star) * distribution[star];
    }
  return count > 0 ? { average: stars / count, count } : null;
}

export async function getPublishedReviews(modelKey: string, page = 1) {
  "use cache: remote";
  cacheLife({ stale: 60, revalidate: 60, expire: 120 });
  const query = new URLSearchParams({ modelKey, status: "published", perPage: String(REVIEWS_PER_PAGE), page: String(page), sort: "newest" });
  return reviewListSchema.parse(await crmRequest(`/reviews?${query}`));
}

/** Uncached; the CRM answers at most 100 model keys per call. */
export async function fetchReviewSummaries(modelKeys: readonly string[]): Promise<ReviewSummary[]> {
  const query = modelKeys.map(encodeURIComponent).join(",");
  return summarySchema.parse(await crmRequest(`/reviews/summary?modelKeys=${query}`)).data;
}

export async function getReviewSummary(modelKey: string): Promise<ReviewSummary> {
  "use cache: remote";
  cacheLife({ stale: 60, revalidate: 60, expire: 120 });
  const summary = (await fetchReviewSummaries([modelKey])).find((item) => item.modelKey === modelKey);
  if (!summary) throw new Error("CRM did not return the review summary");
  return summary;
}

export async function submitReview(input: {
  productId: string; rating: number; authorName: string; authorEmail: string;
  body: string; externalId: string;
}) {
  return z.object({
    data: z.object({ id: z.string(), status: z.literal("pending") }),
    deduplicated: z.boolean(),
  }).parse(await crmRequest("/reviews", { ...input, locale: "uk", status: "pending" }));
}
