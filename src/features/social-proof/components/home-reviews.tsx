import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { NewTabNote } from "@/components/ui/new-tab-note";
import { getListedProducts } from "@/features/catalog/queries";
import type { Product } from "@/features/catalog/types";
import { ReviewStars } from "@/features/reviews/components/review-stars";
import {
  modelKeyOf,
  type PublishedReview,
} from "@/features/reviews/crm-reviews";
import reviewStyles from "@/features/reviews/reviews.module.css";
import type { Locale } from "@/lib/i18n";
import { site } from "@/lib/site";
import { socialProofCopy } from "../copy";
import { reviewExcerpt } from "../display";
import { getHomeReviews } from "../social-proof.server";
import styles from "../social-proof.module.css";

type Copy = (typeof socialProofCopy)[Locale]["reviews"];

/** Published CRM reviews; local development shows samples while there are none. */
async function loadReviews(
  products: readonly Product[],
): Promise<PublishedReview[]> {
  const reviews = await getHomeReviews();
  if (reviews?.length || process.env.NODE_ENV !== "development")
    return reviews ?? [];
  // A dynamic import inside the dropped branch keeps the samples out of production.
  const { previewReviews } = await import("../preview-reviews");
  return previewReviews(products);
}

export async function HomeReviews({ locale }: { locale: Locale }) {
  const products = await getListedProducts().catch(() => []);
  const reviews = await loadReviews(products);
  if (!reviews.length) return null;
  // A review of a product that left the catalog stays, without a link.
  const slugs = new Map(
    products.map((product) => [modelKeyOf(product.id), product.slug]),
  );
  const copy = socialProofCopy[locale].reviews;
  const instagram = site.socials.find((social) => social.label === "Instagram");
  return (
    <section
      className={reviewStyles.homeSection}
      aria-labelledby="home-reviews-title"
    >
      <div className={reviewStyles.sectionHeading}>
        <div>
          <span className={reviewStyles.eyebrow}>{copy.eyebrow}</span>
          <h2 id="home-reviews-title">
            {copy.title} <span aria-hidden="true">♡</span>
          </h2>
        </div>
        {instagram ? (
          <a
            className={reviewStyles.instagramLink}
            href={instagram.href}
            target="_blank"
            rel="noreferrer noopener"
          >
            {copy.instagram}
            <NewTabNote /> <Icon name="arrow" />
          </a>
        ) : null}
      </div>
      <p className={reviewStyles.sectionIntro}>{copy.intro}</p>
      {/* Focusable so the keyboard can scroll cards that hold no link. */}
      <ul className={styles.scroller} aria-label={copy.list} tabIndex={0}>
        {reviews.map((review) => (
          <li key={review.id}>
            <HomeReviewCard
              review={review}
              slug={slugs.get(review.modelKey) ?? null}
              copy={copy}
            />
          </li>
        ))}
      </ul>
      <p className={reviewStyles.handwritten}>{copy.footnote}</p>
    </section>
  );
}

function HomeReviewCard({
  review,
  slug,
  copy,
}: {
  review: PublishedReview;
  slug: string | null;
  copy: Copy;
}) {
  return (
    <article className={`${reviewStyles.card} ${styles.reviewCard}`}>
      <div className={`${reviewStyles.cardTop} ${styles.reviewTop}`}>
        <ReviewStars
          rating={review.rating}
          label={copy.ratingLabel(review.rating)}
        />
        {review.verifiedPurchase ? (
          <span className={styles.verified}>{copy.verified}</span>
        ) : null}
      </div>
      {review.title ? (
        <strong className={styles.reviewTitle}>{review.title}</strong>
      ) : null}
      {review.body ? (
        <p className={reviewStyles.quote}>{reviewExcerpt(review.body)}</p>
      ) : null}
      <div className={reviewStyles.author}>
        <span className={reviewStyles.avatar} aria-hidden="true">
          {Array.from(review.authorName)[0]}
        </span>
        <div>
          <h3>{review.authorName}</h3>
          <time dateTime={review.submittedAt}>
            {copy.date(review.submittedAt)}
          </time>
        </div>
      </div>
      <p className={styles.reviewProduct}>
        {slug ? (
          <Link className={styles.productLink} href={`/product/${slug}`}>
            {review.product.name}
          </Link>
        ) : (
          review.product.name
        )}
      </p>
    </article>
  );
}
