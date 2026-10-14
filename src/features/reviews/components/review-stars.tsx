import { Icon } from "@/components/ui/icon";
import styles from "../reviews.module.css";

export function ReviewStars({ rating }: { rating: number }) {
  return (
    <span
      className={styles.stars}
      role="img"
      aria-label={`Оцінка ${rating} з 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Icon
          name="star"
          key={star}
          className={
            star <= Math.round(rating) ? styles.filledStar : styles.emptyStar
          }
        />
      ))}
    </span>
  );
}
