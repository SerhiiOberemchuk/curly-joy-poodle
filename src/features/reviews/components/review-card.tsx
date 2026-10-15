import type { PublishedReview } from "../crm-reviews";
import styles from "../reviews.module.css";
import { ReviewStars } from "./review-stars";

export function ReviewCard({ review }: { review: PublishedReview }) {
  return (
    <article className={styles.card}>
      <div className={styles.cardTop}>
        <ReviewStars rating={review.rating} />
      </div>
      {review.title ? <strong>{review.title}</strong> : null}
      {review.body ? <p className={styles.quote}>{review.body}</p> : null}
      <div className={styles.author}>
        <span className={styles.avatar} aria-hidden="true">
          {review.authorName[0]}
        </span>
        <div>
          <h3>{review.authorName}</h3>
          <span>
            {review.verifiedPurchase
              ? "Покупку підтверджено"
              : new Date(review.submittedAt).toLocaleDateString("uk-UA", {
                  timeZone: "Europe/Kyiv",
                })}
          </span>
        </div>
        <span className={styles.authorHeart} aria-hidden="true">
          ♡
        </span>
      </div>
      {review.reply ? <p className={styles.reply}><strong>Відповідь магазину:</strong> {review.reply.body}</p> : null}
    </article>
  );
}
