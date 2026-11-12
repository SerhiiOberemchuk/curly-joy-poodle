import Link from "next/link";
import type { ReactNode } from "react";

import { Bone } from "@/components/ui/skeleton";

import { REVIEWS_PER_PAGE, type PublishedReview, type ReviewSummary } from "../crm-reviews";
import styles from "../reviews.module.css";
import { ReviewCard, ReviewCardSkeleton } from "./review-card";
import { ReviewStars } from "./review-stars";

const reviewCount = (count: number) => {
  const form = new Intl.PluralRules("uk").select(count);
  return `${count} ${form === "one" ? "відгук" : form === "few" ? "відгуки" : "відгуків"}`;
};

/** The layout and submission form do not wait for published reviews. */
export function ProductReviewsSection({ children, form }: { children: ReactNode; form: ReactNode }) {
  return (
    <section className={styles.productSection} id="product-reviews" aria-labelledby="product-reviews-title">
      <div className={styles.sectionHeading}>
        <div>
          <span className={styles.eyebrow}>Від хвостиків та їхніх людей</span>
          <h2 id="product-reviews-title">Відгуки покупців <span aria-hidden="true">♡</span></h2>
        </div>
      </div>
      <p className={styles.sectionIntro}>Розкажіть про свій досвід із цим товаром.</p>
      <div className={styles.reviewLayout}>
        <div>{children}</div>
        {form}
      </div>
    </section>
  );
}

const emptyNote = [
  "Поки немає опублікованих відгуків про цей товар.",
  "Ваш може стати першим — форма поруч.",
] as const;

export function ProductReviewSummarySkeleton({ count }: { count: number | null }) {
  if (count === 0) {
    return (
      <div className={styles.emptyReviews} aria-hidden="true">
        <Bone className={styles.emptyIconBone} />
        {emptyNote.map((line) => <Bone key={line} className={styles.emptyLineBone}>{line}</Bone>)}
      </div>
    );
  }
  return (
    <div className={styles.summary} aria-hidden="true">
      <div>
        <Bone className={styles.average}>0,0</Bone>
        <Bone line>★★★★★</Bone>
        <p><Bone line>Відгуки покупців</Bone></p>
      </div>
      <div className={styles.distribution}>
        {[5, 4, 3, 2, 1].map((rating) => (
          <div className={styles.distributionRow} key={rating}>
            <span>{rating} ★</span><Bone className={styles.distributionBone} /><Bone line>0</Bone>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProductReviewsSkeleton({ count }: { count: number | null }) {
  const cards = Math.min(count ?? 2, REVIEWS_PER_PAGE);
  if (cards === 0) return null;
  return (
    <>
      <p className="visually-hidden" role="status">Завантажуємо відгуки…</p>
      <div className={styles.productCards}>
        {Array.from({ length: cards }, (_, index) => <ReviewCardSkeleton key={index} />)}
      </div>
    </>
  );
}

export function ProductReviewSummary({ summary }: { summary: ReviewSummary | null }) {
  if (!summary) return <p className={styles.emptyReviews} role="status">Рейтинг тимчасово недоступний.</p>;
  const { count, average } = summary;
  if (count === 0) {
    return (
      <div className={styles.emptyReviews}>
        <span className={styles.emptyIcon} aria-hidden="true">♡</span>
        {emptyNote.map((line) => <p key={line}>{line}</p>)}
      </div>
    );
  }
  return (
    <div className={styles.summary}>
      <div>
        <strong className={styles.average}>{(average ?? 0).toFixed(1).replace(".", ",")}</strong>
        <ReviewStars rating={average ?? 0} />
        <p>{reviewCount(count)}</p>
      </div>
      <div className={styles.distribution}>
        {([5, 4, 3, 2, 1] as const).map((rating) => {
          const total = summary.distribution[rating];
          return (
            <div className={styles.distributionRow} key={rating}>
              <span>{rating} <span aria-hidden="true">★</span></span>
              <meter min={0} max={count} value={total} aria-label={`Оцінка ${rating} із 5: ${reviewCount(total)}`} />
              <span>{total}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ProductReviews({ productSlug, reviews, page, total, unavailable }: {
  productSlug: string;
  reviews: readonly PublishedReview[];
  page: number;
  total: number;
  unavailable: boolean;
}) {
  if (unavailable) return <p role="status">Відгуки тимчасово недоступні.</p>;
  return (
    <>
      <div className={styles.productCards}>
        {reviews.map((review) => <ReviewCard key={review.id} review={review} />)}
      </div>
      {total > REVIEWS_PER_PAGE ? (
        <nav className={styles.reviewPages} aria-label="Сторінки відгуків">
          {page > 1 ? <Link href={`/product/${productSlug}?reviewsPage=${page - 1}#product-reviews`}>← Новіші</Link> : null}
          <span>Сторінка {page}</span>
          {page * REVIEWS_PER_PAGE < total ? <Link href={`/product/${productSlug}?reviewsPage=${page + 1}#product-reviews`}>Старіші →</Link> : null}
        </nav>
      ) : null}
    </>
  );
}
