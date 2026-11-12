import type { PublishedReview } from "../crm-reviews";
import { Bone } from "@/components/ui/skeleton";
import styles from "../reviews.module.css";
import { ReviewStars } from "./review-stars";

export function ReviewCardSkeleton() {
  return (
    <div className={styles.card} aria-hidden="true">
      <div className={styles.cardTop}><Bone line>★★★★★</Bone></div>
      <div className={styles.quote}>
        <Bone line />
        <Bone line />
        <Bone line />
      </div>
      <div className={styles.author}>
        <Bone className={styles.avatar} />
        <div><Bone line>Ім’я покупця</Bone><Bone line>Дата відгуку</Bone></div>
      </div>
    </div>
  );
}

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
