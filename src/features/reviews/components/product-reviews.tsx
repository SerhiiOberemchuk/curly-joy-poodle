import type { PublishedReview, ReviewSummary } from "../crm-reviews";
import Link from "next/link";
import styles from "../reviews.module.css";
import { ReviewCard } from "./review-card";
import { ReviewForm } from "./review-form";
import { ReviewStars } from "./review-stars";

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
    <section
      className={styles.productSection}
      id="product-reviews"
      aria-labelledby="product-reviews-title"
    >
      <div className={styles.sectionHeading}>
        <div>
          <span className={styles.eyebrow}>Від хвостиків та їхніх людей</span>
          <h2 id="product-reviews-title">
            Маленькі історії щастя <span aria-hidden="true">♡</span>
          </h2>
        </div>
        <div className={styles.headingActions}>
          <a className={styles.writeReview} href="#review-form">
            Залишити відгук ↗
          </a>
        </div>
      </div>
      <p className={styles.sectionIntro}>
        Розкажіть, що сподобалося вам і вашому хвостику.
      </p>
      <div className={styles.reviewLayout}>
        <div>
          {unavailable ? (
            <p role="status">Відгуки тимчасово недоступні.</p>
          ) : count === 0 ? (
            <p>Поки немає опублікованих відгуків про цей товар. Ваш може стати першим.</p>
          ) : (
            <div className={styles.summary}>
              <div>
                <strong className={styles.average}>
                  {average.toFixed(1).replace(".", ",")}
                </strong>
                <ReviewStars rating={average} />
                <p>{count} відгуків</p>
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
                        aria-label={`${rating} зірок: ${total} відгуків`}
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
    </section>
  );
}
