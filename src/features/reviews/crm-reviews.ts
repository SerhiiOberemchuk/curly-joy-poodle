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
  product: z.object({ id: z.string(), name: z.string() }),
});

const listSchema = z.object({
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

export async function getPublishedReviews(modelKey: string, page = 1) {
  "use cache: remote";
  cacheLife({ stale: 60, revalidate: 60, expire: 120 });
  const query = new URLSearchParams({ modelKey, status: "published", perPage: "20", page: String(page), sort: "newest" });
  return listSchema.parse(await crmRequest(`/reviews?${query}`));
}

export async function getReviewSummary(modelKey: string): Promise<ReviewSummary> {
  "use cache: remote";
  cacheLife({ stale: 60, revalidate: 60, expire: 120 });
  const response = summarySchema.parse(await crmRequest(`/reviews/summary?modelKeys=${encodeURIComponent(modelKey)}`));
  const summary = response.data.find((item) => item.modelKey === modelKey);
  if (!summary) throw new Error("CRM did not return the review summary");
  return summary;
}

export async function getRecentPublishedReviews() {
  "use cache: remote";
  cacheLife({ stale: 60, revalidate: 60, expire: 120 });
  return listSchema.parse(await crmRequest("/reviews?status=published&perPage=3&sort=newest")).data;
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
