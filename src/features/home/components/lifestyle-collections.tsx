import Image from "next/image";
import Link from "next/link";

import { lifestyleMoments } from "../lifestyle-content";
import styles from "../lifestyle.module.css";
import { Arrow, EditorialLink } from "./editorial-link";

export function LifestyleCollections() {
  return (
    <section
      id="moments"
      className={`${styles.wrap} ${styles.section}`}
      aria-labelledby="moments-title"
    >
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.handwritten}>У кожного хвостика свої плани</p>
          <h2 id="moments-title" className={styles.sectionTitle}>
            А що любите ви?
          </h2>
        </div>
        <p className={styles.headingNote}>
          Від «ну ще п’ять хвилин погуляємо»
          <br />
          до «посунься, я теж хочу на диван».
        </p>
      </div>
      <div className={styles.momentsGrid}>
        {lifestyleMoments.map((moment, index) => (
          <Link
            key={moment.collection}
            href={`/collection/${moment.collection}`}
            className={`${styles.moment} ${styles[moment.framing]}`}
          >
            <div className={styles.momentPhoto}>
              {moment.framing === "dress" ? (
                <span className={styles.dressNote}>
                  Маю лапки.
                  <br />
                  Маю стиль.
                </span>
              ) : null}
              <Image
                src={moment.image}
                alt={moment.alt}
                fill
                sizes="(max-width: 640px) 100vw, (min-width: 1440px) 760px, 60vw"
              />
              <span className={styles.momentIndex} aria-hidden="true">
                0{index + 1}
              </span>
              <span className={styles.momentCta}>
                До добірки <Arrow diagonal />
              </span>
            </div>
            <div className={styles.momentCaption}>
              <h3>{moment.title}</h3>
              <p>{moment.description}</p>
            </div>
          </Link>
        ))}
      </div>
      <div className={styles.catalogPrompt}>
        <p>Точно знаєте, що шукаєте?</p>
        <EditorialLink href="/catalog">Усі товари в каталозі</EditorialLink>
      </div>
    </section>
  );
}
