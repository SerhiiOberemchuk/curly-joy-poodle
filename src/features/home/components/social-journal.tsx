import Image from "next/image";

import { site } from "@/lib/site";

import { journalPhotos } from "../lifestyle-content";
import styles from "../lifestyle.module.css";
import { Arrow } from "./editorial-link";

export function SocialJournal() {
  const instagram = site.socials.find(
    (social) => social.label === "Instagram",
  )!;

  return (
    <section className={styles.journal} aria-labelledby="journal-title">
      <div className={styles.wrap}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.handwritten}>
              Обережно, хочеться передивлятись
            </p>
            <h2 id="journal-title" className={styles.sectionTitle}>
              Трохи шерсті у вашій стрічці.
            </h2>
          </div>
          <a
            href={instagram.href}
            className={styles.textLink}
            target="_blank"
            rel="noreferrer noopener"
          >
            @curly_joy_poodle <Arrow diagonal />
          </a>
        </div>
        <div className={styles.journalGrid}>
          {journalPhotos.map((photo) => (
            <a
              key={photo.image}
              href={instagram.href}
              className={styles.journalPhoto}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={`${photo.alt} — відкрити Instagram Curly Joy`}
            >
              <Image
                src={photo.image}
                alt={photo.alt}
                fill
                sizes="(max-width: 640px) 50vw, (min-width: 1440px) 310px, 25vw"
              />
              <span className={styles.journalArrow}>
                <Arrow diagonal />
              </span>
            </a>
          ))}
        </div>
        <p className={styles.journalCaption}>
          Більше хвостиків, щирих моментів і маленьких відкриттів — у нашому
          Instagram.
        </p>
      </div>
    </section>
  );
}
