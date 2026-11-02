import type { PublishedReview, ReviewSummary } from "../crm-reviews";
import Link from "next/link";
import type { ReactNode } from "react";
import { Bone } from "@/components/ui/skeleton";
import styles from "../reviews.module.css";
import { ReviewCard } from "./review-card";
import { ReviewForm } from "./review-form";
import { ReviewStars } from "./review-stars";

const reviewCount = (count: number) => {
  const form = new Intl.PluralRules("uk").select(count);
  return `${count} ${form === "one" ? "відгук" : form === "few" ? "відгуки" : "відгуків"}`;
};

/** The section and its heading: static, so the page outline is in the shell. */
export function ProductReviewsSection({ children }: { children: ReactNode }) {
  return (
    <section
      className={styles.productSection}
      id="product-reviews"
      aria-labelledby="product-reviews-title"
    >
      <div className={styles.sectionHeading}>
        <div>
          <span className={styles.eyebrow}>Від хвостиків та їхніх людей</span>
          <h2 id="product-reviews-title">
            Відгуки покупців <span aria-hidden="true">♡</span>
          </h2>
        </div>
      </div>
      <p className={styles.sectionIntro}>
        Розкажіть про свій досвід із цим товаром.
      </p>
      {children}
    </section>
  );
}

/** The «no reviews yet» note; its skeleton keeps the same lines. */
const emptyNote = [
  "Поки немає опублікованих відгуків про цей товар.",
  "Ваш може стати першим — форма поруч.",
] as const;

/**
 * The most common state's frame — the note beside the form — with the form
 * itself, disabled until the reviews and the page's request id arrive.
 */
export function ProductReviewsSkeleton({ productId }: { productId: string }) {
  return (
    <div className={styles.reviewLayout} data-empty>
      <div>
        <p className="visually-hidden" role="status">
          Завантажуємо відгуки…
        </p>
        <div className={styles.emptyReviews} aria-hidden="true">
          <Bone className={styles.emptyIconBone} />
          {emptyNote.map((line) => (
            <Bone key={line} className={styles.emptyLineBone}>{line}</Bone>
          ))}
        </div>
      </div>
      <ReviewForm key={productId} productId={productId} />
    </div>
  );
}

export function ProductReviews({ productId, productSlug, requestId, reviews, page, total, summary, unavailable }: {
  productId: string;
  productSlug: string;
  requestId: string;
  reviews: readonly PublishedReview[];
  page: number;
  total: number;
  summary: ReviewSummary | null;
  unavailable: boolean;
}) {
  const average = summary?.average ?? 0;
  const count = summary?.count ?? 0;
  return (
    <div className={styles.reviewLayout} data-empty={count === 0 || undefined}>
      <div>
        {unavailable ? (
          <p className={styles.emptyReviews} role="status">
            Відгуки тимчасово недоступні.
          </p>
        ) : count === 0 ? (
          <div className={styles.emptyReviews}>
            <span className={styles.emptyIcon} aria-hidden="true">♡</span>
            {emptyNote.map((line) => <p key={line}>{line}</p>)}
          </div>
        ) : (
          <div className={styles.summary}>
            <div>
              <strong className={styles.average}>
                {average.toFixed(1).replace(".", ",")}
              </strong>
              <ReviewStars rating={average} />
              <p>{reviewCount(count)}</p>
            </div>
            <div className={styles.distribution}>
              {([5, 4, 3, 2, 1] as const).map((rating) => {
                const total = summary?.distribution[rating] ?? 0;
                return (
                  <div className={styles.distributionRow} key={rating}>
                    <span>
                      {rating} <span aria-hidden="true">★</span>
                    </span>
                    <meter
                      min={0}
                      max={count}
                      value={total}
                      aria-label={`Оцінка ${rating} із 5: ${reviewCount(total)}`}
                    />
                    <span>{total}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className={styles.productCards}>
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
        {total > 20 ? (
          <nav className={styles.reviewPages} aria-label="Сторінки відгуків">
            {page > 1 ? (
              <Link href={`/product/${productSlug}?reviewsPage=${page - 1}#product-reviews`}>← Новіші</Link>
            ) : null}
            <span>Сторінка {page}</span>
            {page * 20 < total ? (
              <Link href={`/product/${productSlug}?reviewsPage=${page + 1}#product-reviews`}>Старіші →</Link>
            ) : null}
          </nav>
        ) : null}
      </div>
      <ReviewForm
        key={productId}
        productId={productId}
        requestId={requestId}
      />
    </div>
  );
}
