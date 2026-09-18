import Image from "next/image";
import Link from "next/link";

import { homeMoments } from "../reference-content";
import { getHomeRecommendations } from "../queries";
import styles from "../reference.module.css";
import { HomeIcon } from "./home-icon";
import { HomeProductCards } from "./home-interactions";
import { ReferenceArtwork } from "./reference-artwork";

export function ReferenceHero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <Image
        src="/images/home/hero.webp"
        alt="Чотири кучеряві пуделі разом у м’якій лежанці в сонячній кімнаті"
        fill
        preload
        sizes="(min-width: 1600px) 1600px, 100vw"
        className={styles.heroImage}
      />
      <div className={styles.heroCopy}>
        <h1 id="hero-title">
          Усе для
          <br />
          щасливого життя
          <br />
          із собакою <span className={styles.heart}>♡</span>
        </h1>
        <p>
          Вибираємо, тестуємо і рекомендуємо те,
          <br className={styles.desktopBreak} /> чим користуємося самі.
        </p>
        <div className={styles.heroButtons}>
          <Link className={styles.button} href="/catalog">
            Перейти до магазину <HomeIcon name="arrow" />
          </Link>
          <Link className={styles.lightButton} href="#moments">
            Дізнатися більше
          </Link>
        </div>
        <span className={styles.smallDogs} lang="en">
          Small dogs
          <br />
          <span>
            Big happiness <b>♡</b>
          </span>
        </span>
      </div>
      <span className={styles.happyTogether} lang="en">
        Happy
        <br />
        together
        <br />
        <b>♥</b>
      </span>
      <span className={styles.bedBrand} lang="en">
        CURLY JOY
      </span>
    </section>
  );
}

const benefits = [
  {
    icon: "paw",
    title: "Перевірені товари",
    description: "Те, чим користуємося самі",
  },
  { icon: "truck", title: "Швидка доставка", description: "по Україні" },
  {
    icon: "heart",
    title: "Підтримка 7 днів",
    description: "Ми завжди на зв’язку",
  },
  { icon: "leaf", title: "Турбота про собак", description: "і їхніх людей" },
] as const;

export function ReferenceBenefits() {
  return (
    <ul className={styles.benefits} aria-label="Переваги Curly Joy">
      {benefits.map((benefit) => (
        <li key={benefit.title}>
          <HomeIcon name={benefit.icon} />
          <div>
            <strong>{benefit.title}</strong>
            <span>{benefit.description}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ReferenceMoments() {
  return (
    <section
      id="moments"
      className={styles.moments}
      aria-labelledby="moments-title"
    >
      <div className={styles.momentsHeading}>
        <h2 id="moments-title">
          Життя із собакою <span className={styles.heart}>♡</span>
        </h2>
        <div>
          <p>Різні історії. Одне велике щастя.</p>
          <span>Оберіть свою ситуацію — ми вже зібрали найкращі товари.</span>
        </div>
        <span className={styles.dogNote} lang="en">
          Dogs
          <br />
          make life
          <br />
          better <b>♡</b>
        </span>
      </div>
      <div className={styles.momentGrid}>
        {homeMoments.map((moment) => (
          <Link
            key={moment.title}
            href={moment.href}
            className={styles.momentCard}
          >
            <ReferenceArtwork
              window={moment.artwork}
              className={styles.momentImage}
            />
            <div className={styles.momentCaption}>
              <svg
                className={styles.momentCaptionShape}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d="M0 14C18 4 42 1 64 5C83 8 100 11 100 22V76C100 91 91 100 76 100H0Z" />
              </svg>
              <h3>{moment.title}</h3>
              <p>{moment.description}</p>
            </div>
            <span className={styles.roundArrow}>
              <HomeIcon name="arrow" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export async function ReferenceRecommendations() {
  const recommendations = await getHomeRecommendations();

  return (
    <section
      id="recommendations"
      className={styles.recommendations}
      aria-labelledby="recommendations-title"
    >
      <div className={styles.recommendationCopy} id="story">
        <h2 id="recommendations-title">
          Curly Joy
          <br />
          рекомендує <span className={styles.heart}>♡</span>
        </h2>
        <p>
          Те, що ми спробували на собі.
          <br />
          Точніше — на наших собаках.
        </p>
        <Link className={styles.button} href="/collection/curly-joy-recommends">
          Дивитися всі товари <HomeIcon name="arrow" />
        </Link>
      </div>
      <HomeProductCards recommendations={recommendations} />
    </section>
  );
}

export function ReferencePromotions() {
  return (
    <section
      className={styles.promotions}
      aria-label="Більше натхнення для життя разом"
    >
      <Link
        href="/catalog?sort=newest"
        className={`${styles.promo} ${styles.newPromo}`}
      >
        <ReferenceArtwork
          window={[20, 1272, 325, 160]}
          className={styles.promoImage}
        />
        <div className={styles.promoCopy}>
          <h2 lang="en">
            New
            <br />
            <span>in</span>
          </h2>
          <span className={styles.promoButton}>
            Дивитися новинки <HomeIcon name="arrow" />
          </span>
        </div>
      </Link>
      <Link
        href="/collection/all-season"
        className={`${styles.promo} ${styles.seasonPromo}`}
      >
        <ReferenceArtwork
          window={[358, 1272, 310, 163]}
          className={styles.promoImage}
        />
        <div className={styles.promoCopy}>
          <h2>Сезонні добірки</h2>
          <p>
            Літо, зима, дощовий сезон,
            <br />
            сезон кліщів
          </p>
          <span className={styles.promoButton}>
            Дивитися <HomeIcon name="arrow" />
          </span>
        </div>
      </Link>
      <Link
        href="/collection/dress-up"
        className={`${styles.promo} ${styles.dressPromo}`}
      >
        <ReferenceArtwork
          window={[681, 1272, 322, 160]}
          className={styles.promoImage}
        />
        <div className={styles.promoCopy}>
          <h2>
            Одягаємось
            <br />
            разом
          </h2>
          <p>
            Стиль для собаки
            <br />
            та її людини
          </p>
          <span className={styles.promoButton}>
            Дивитися <HomeIcon name="arrow" />
          </span>
        </div>
      </Link>
    </section>
  );
}
