import { demoReviews, reviewSummary } from "../demo";
import styles from "../reviews.module.css";
import { ReviewCard } from "./review-card";
import { ReviewForm } from "./review-form";
import { ReviewStars } from "./review-stars";

export function ProductReviews({ productId }: { productId: string }) {
  const { average, count } = reviewSummary(demoReviews);
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
          <div className={styles.summary}>
            <div>
              <strong className={styles.average}>
                {average.toFixed(1).replace(".", ",")}
              </strong>
              <ReviewStars rating={average} />
              <p>{count} відгуки</p>
            </div>
            <div className={styles.distribution}>
              {[5, 4, 3, 2, 1].map((rating) => {
                const total = demoReviews.filter(
                  (review) => review.rating === rating,
                ).length;
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
          <div className={styles.productCards}>
            {demoReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </div>
        <ReviewForm key={productId} productId={productId} />
      </div>
    </section>
  );
}
