"use client";

import useSWR from "swr";

import { Icon } from "@/components/ui/icon";
import styles from "@/features/catalog/components/product-card.module.css";

import { getCardRatingsAction } from "../card-ratings.actions";

async function loadRatings() {
  const result = await getCardRatingsAction();
  if (!result.ok) throw new Error("Ratings unavailable");
  return result.ratings;
}

const averageFormat = new Intl.NumberFormat("uk", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function ProductCardRating({ productId }: { productId: string }) {
  // All cards share this SWR key: one action, never one request per card.
  const { data } = useSWR("catalog-published-ratings", loadRatings, {
    dedupingInterval: 60_000,
    revalidateOnFocus: false,
    errorRetryCount: 1,
  });
  const rating = data?.[productId];
  return (
    <div className={styles.rating}>
      {rating ? (
        <span role="img" aria-label={`Оцінка ${averageFormat.format(rating.average)} із 5. Відгуків: ${rating.count}`}>
          <Icon name="star" />
          {averageFormat.format(rating.average)} <span>({rating.count})</span>
        </span>
      ) : null}
    </div>
  );
}
