import "server-only";
import { cacheLife } from "next/cache";
import { z } from "zod";
import { getListedProducts } from "@/features/catalog/queries";
import {
  fetchReviewSummaries,
  modelKeyOf,
  ratingFromSummaries,
  reviewListSchema,
  type PublishedReview,
} from "@/features/reviews/crm-reviews";
import { CrmApiError, crmRequest } from "@/lib/crm-client";
import { crmFailureDetails } from "@/lib/crm-errors";

// Every read below is cached for all visitors: the token's quota of CRM reads
// is shared with the cart and checkout. A failure is cached for minutes too,
// so a missing permission or an outage costs one read, not one per visitor.

const SUMMARY_KEYS_PER_REQUEST = 100;

function logHidden(part: string, scope: string, error: unknown) {
  console.error(`[social-proof] The ${part} is hidden: the CRM read failed.`, {
    ...crmFailureDetails(error),
    ...(error instanceof CrmApiError && error.status === 403
      ? {
          hint: `The site token lacks ${scope}. Add it in the CRM: Налаштування → Інтеграції → API-токени → «Змінити права»; no new key is needed.`,
        }
      : {}),
  });
}

/** Newest published reviews; what is published is decided by moderation in the CRM. */
export async function getHomeReviews(): Promise<PublishedReview[] | null> {
  "use cache: remote";
  try {
    const { data } = reviewListSchema.parse(
      await crmRequest("/reviews?status=published&perPage=8&sort=newest"),
    );
    cacheLife("hours");
    return data;
  } catch (error) {
    logHidden("review list", "reviews:read", error);
    cacheLife("minutes");
    return null;
  }
}

export interface ShopRating {
  average: number;
  count: number;
}

/** Published reviews of every listed model, averaged from exact star counts. */
export async function getShopRating(): Promise<ShopRating | null> {
  "use cache: remote";
  try {
    const keys = [
      ...new Set(
        (await getListedProducts()).map((product) => modelKeyOf(product.id)),
      ),
    ];
    const batches: string[][] = [];
    for (let start = 0; start < keys.length; start += SUMMARY_KEYS_PER_REQUEST)
      batches.push(keys.slice(start, start + SUMMARY_KEYS_PER_REQUEST));
    const summaries = (
      await Promise.all(batches.map(fetchReviewSummaries))
    ).flat();
    cacheLife("hours");
    return ratingFromSummaries(summaries);
  } catch (error) {
    logHidden("shop rating", "reviews:read", error);
    cacheLife("minutes");
    return null;
  }
}

const orderCountSchema = z.object({
  pagination: z.object({ total: z.int().nonnegative() }),
});

/**
 * Delivered orders the site itself created: the token sees no orders that came
 * through Instagram or were entered by hand, so this undercounts customers.
 */
export async function getDeliveredOrderCount(): Promise<number | null> {
  "use cache: remote";
  try {
    const { pagination } = orderCountSchema.parse(
      await crmRequest("/orders?status=delivered&perPage=1"),
    );
    cacheLife("days");
    return pagination.total;
  } catch (error) {
    logHidden("customer counter", "orders:read", error);
    cacheLife("minutes");
    return null;
  }
}

/** The owner's own customer count across every channel (`SOCIAL_PROOF_CUSTOMERS_MANUAL`). */
export function getManualCustomerCount(): number | null {
  const raw = process.env.SOCIAL_PROOF_CUSTOMERS_MANUAL?.trim();
  if (!raw) return null;
  if (!/^\d{1,9}$/.test(raw)) {
    console.error(
      "[social-proof] SOCIAL_PROOF_CUSTOMERS_MANUAL must be a whole number; it is ignored.",
    );
    return null;
  }
  return Number(raw);
}
