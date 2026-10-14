import type { Review } from "../demo";
import styles from "../reviews.module.css";
import { ReviewStars } from "./review-stars";

export function ReviewCard({ review }: { review: Review }) {
  return (
    <article className={styles.card}>
      <div className={styles.cardTop}>
        <ReviewStars rating={review.rating} />
      </div>
      <p className={styles.quote}>{review.text}</p>
      <div className={styles.author}>
        <span className={styles.avatar} aria-hidden="true">
          {review.author[0]}
        </span>
        <div>
          <h3>{review.author}</h3>
          <span>{review.companion}</span>
        </div>
        <span className={styles.authorHeart} aria-hidden="true">
          ♡
        </span>
      </div>
    </article>
  );
}
