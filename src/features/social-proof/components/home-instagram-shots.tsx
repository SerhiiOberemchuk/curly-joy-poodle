import Image from "next/image";
import { Icon } from "@/components/ui/icon";
import { NewTabNote } from "@/components/ui/new-tab-note";
import reviewStyles from "@/features/reviews/reviews.module.css";
import type { Locale } from "@/lib/i18n";
import { site } from "@/lib/site";
import { instagramFollowers, instagramScreenshots } from "../config";
import { socialProofCopy } from "../copy";
import styles from "../social-proof.module.css";

/** Screenshots the owner curated in `config.ts`; not a live Instagram feed. */
export function HomeInstagramShots({ locale }: { locale: Locale }) {
  if (!instagramScreenshots.length) return null;
  const copy = socialProofCopy[locale].instagram;
  const instagram = site.socials.find((social) => social.label === "Instagram");
  return (
    <section className={styles.instagram} aria-labelledby="home-instagram-title">
      <div className={reviewStyles.sectionHeading}>
        <div>
          <span className={reviewStyles.eyebrow}>{copy.eyebrow}</span>
          <h2 id="home-instagram-title">
            {copy.title} <span aria-hidden="true">♡</span>
          </h2>
        </div>
        {instagram ? (
          <a
            className={styles.follow}
            href={instagram.href}
            target="_blank"
            rel="noreferrer noopener"
          >
            {copy.follow(instagramFollowers)}
            <NewTabNote />
            <Icon name="arrow" />
          </a>
        ) : null}
      </div>
      <ul
        className={`${styles.scroller} ${styles.shots}`}
        aria-label={copy.list}
        tabIndex={0}
      >
        {instagramScreenshots.map((shot) => (
          <li key={shot.src} className={styles.shot}>
            <Image src={shot.src} alt={shot.alt} fill sizes="(width >= 700px) 240px, 62vw" />
          </li>
        ))}
      </ul>
    </section>
  );
}
