import { Icon } from "@/components/ui/icon";
import styles from "../reviews.module.css";

const ratingFormat = new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 1 });

export function ReviewStars({
  rating,
  label = `Оцінка ${ratingFormat.format(rating)} з 5`,
}: {
  rating: number;
  label?: string;
}) {
  return (
    <span className={styles.stars} role="img" aria-label={label}>
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
