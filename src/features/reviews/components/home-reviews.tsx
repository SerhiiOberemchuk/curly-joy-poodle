import { Icon } from "@/components/ui/icon";
import { site } from "@/lib/site";
import { getRecentPublishedReviews } from "../crm-reviews";
import styles from "../reviews.module.css";
import { ReviewCard } from "./review-card";

export async function HomeReviews() {
  const reviews = await getRecentPublishedReviews().catch(() => null);
  if (!reviews?.length) return null;
  return (
    <section
      className={styles.homeSection}
      aria-labelledby="home-reviews-title"
    >
      <div className={styles.sectionHeading}>
        <div>
          <span className={styles.eyebrow}>Curly Joy — для життя разом</span>
          <h2 id="home-reviews-title">
            Враження покупців <span aria-hidden="true">♡</span>
          </h2>
        </div>
        <a
          className={styles.instagramLink}
          href={site.socials[0].href}
          target="_blank"
          rel="noreferrer noopener"
        >
          Більше історій в Instagram <Icon name="arrow" />
        </a>
      </div>
      <p className={styles.sectionIntro}>
        Дізнайтеся, як покупці оцінюють товари Curly Joy.
      </p>
      <div className={styles.homeCards}>
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
      <p className={styles.handwritten}>У кожного хвостика — своя історія.</p>
    </section>
  );
}
