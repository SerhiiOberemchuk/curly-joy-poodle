import { Icon } from "@/components/ui/icon";
import { ReviewStars } from "@/features/reviews/components/review-stars";
import type { Locale } from "@/lib/i18n";
import { socialProofCopy } from "../copy";
import { MIN_CUSTOMERS, MIN_RATING_REVIEWS, roundDownCount } from "../display";
import {
  getDeliveredOrderCount,
  getManualCustomerCount,
  getShopRating,
} from "../social-proof.server";
import styles from "../social-proof.module.css";
import { SocialProofPart } from "./social-proof-part";

/** The rating and counter strip; it disappears when neither has data. */
export function HomeSocialStats({ locale }: { locale: Locale }) {
  return (
    <ul className={styles.stats} aria-label={socialProofCopy[locale].stats.label}>
      <SocialProofPart>
        <ShopRating locale={locale} />
      </SocialProofPart>
      <SocialProofPart>
        <CustomerCount locale={locale} />
      </SocialProofPart>
    </ul>
  );
}

export async function ShopRating({ locale }: { locale: Locale }) {
  const rating = await getShopRating();
  if (!rating || rating.count < MIN_RATING_REVIEWS) return null;
  const copy = socialProofCopy[locale].stats;
  return (
    <li className={styles.stat}>
      <ReviewStars
        rating={rating.average}
        label={copy.ratingLabel(rating.average)}
      />
      {/* The stars' label already reads the average aloud. */}
      <strong className={styles.statValue} aria-hidden="true">
        {copy.average(rating.average)}
      </strong>
      <span className={styles.statText}>
        <span aria-hidden="true">· </span>
        {copy.reviews(rating.count)}
      </span>
    </li>
  );
}

export async function CustomerCount({ locale }: { locale: Locale }) {
  const delivered = await getDeliveredOrderCount();
  const count = Math.max(delivered ?? 0, getManualCustomerCount() ?? 0);
  if (count < MIN_CUSTOMERS) return null;
  const copy = socialProofCopy[locale].stats;
  return (
    <li className={styles.stat}>
      <Icon name="heart" className={styles.statIcon} />
      <strong className={styles.statValue}>
        {copy.customers(roundDownCount(count))}
      </strong>
      <span className={styles.statText}>{copy.customersText}</span>
    </li>
  );
}
