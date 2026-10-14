import { Icon } from "@/components/ui/icon";
import { site } from "@/lib/site";
import { demoReviews } from "../demo";
import styles from "../reviews.module.css";
import { ReviewCard } from "./review-card";

export function HomeReviews() {
  return (
    <section
      className={styles.homeSection}
      aria-labelledby="home-reviews-title"
    >
      <div className={styles.sectionHeading}>
        <div>
          <span className={styles.eyebrow}>Curly Joy — для життя разом</span>
          <h2 id="home-reviews-title">
            Щастя, яким діляться <span aria-hidden="true">♡</span>
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
        Маленькі знахідки для великих пригод — і враження, якими хочеться
        поділитися.
      </p>
      <div className={styles.homeCards}>
        {demoReviews.slice(0, 3).map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
      <p className={styles.handwritten}>У кожного хвостика — своя історія.</p>
    </section>
  );
}
