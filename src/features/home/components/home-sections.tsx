import Image from "next/image";
import Link from "next/link";

import { Icon } from "@/components/ui/icon";

import styles from "../home.module.css";
import {
  getHomeCategories,
  getHomeRecommendations,
  RECOMMENDATIONS_COLLECTION,
} from "../queries";
import { ProductTile } from "./product-tile";
import { ReferenceArtwork } from "./reference-artwork";

/** A hand-drawn heart after a heading: decoration, not part of its name. */
function Heart() {
  return (
    <span className={styles.heart} aria-hidden="true">
      ♡
    </span>
  );
}

export function HomeHero() {
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
          із собакою <Heart />
        </h1>
        <p>
          Вибираємо, тестуємо і рекомендуємо те,
          <br className={styles.desktopBreak} /> чим користуємося самі.
        </p>
        <div className={styles.heroButtons}>
          <Link className={styles.button} href="/catalog">
            Перейти до магазину <Icon name="arrow" />
          </Link>
          <Link className={styles.lightButton} href="#categories">
            Дізнатися більше
          </Link>
        </div>
        <span className={styles.smallDogs} lang="en" aria-hidden="true">
          Small dogs
          <br />
          <span>
            Big happiness <b>♡</b>
          </span>
        </span>
      </div>
      <span className={styles.happyTogether} lang="en" aria-hidden="true">
        Happy
        <br />
        together
        <br />
        <b>♥</b>
      </span>
      <span className={styles.bedBrand} lang="en" aria-hidden="true">
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

export function HomeBenefits() {
  return (
    <ul className={styles.benefits} aria-label="Переваги Curly Joy">
      {benefits.map((benefit) => (
        <li key={benefit.title}>
          <Icon name={benefit.icon} />
          <div>
            <strong>{benefit.title}</strong>
            <span>{benefit.description}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export async function HomeCategories() {
  const categories = await getHomeCategories();

  return (
    <section
      id="categories"
      className={styles.categories}
      aria-labelledby="categories-title"
    >
      <div className={styles.categoriesHeading}>
        <h2 id="categories-title">
          Життя із собакою <Heart />
        </h2>
        <div>
          <p>Різні історії. Одне велике щастя.</p>
          <span>Оберіть свою ситуацію — ми вже зібрали найкращі товари.</span>
        </div>
        <span className={styles.dogNote} lang="en" aria-hidden="true">
          Dogs
          <br />
          make life
          <br />
          better <b>♡</b>
        </span>
      </div>
      <div className={styles.categoryGrid}>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/catalog/${category.slug}`}
            className={styles.categoryCard}
          >
            <span className={styles.categoryImage} aria-hidden="true">
              {category.coverUrl ? (
                <Image
                  src={category.coverUrl}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 50vw, 400px"
                />
              ) : null}
            </span>
            <div className={styles.categoryCaption}>
              <svg
                className={styles.categoryCaptionShape}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d="M0 14C18 4 42 1 64 5C83 8 100 11 100 22V100H0Z" />
              </svg>
              <h3>{category.title}</h3>
              {category.description ? <p>{category.description}</p> : null}
            </div>
            <span className={styles.roundArrow}>
              <Icon name="arrow" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export async function HomeRecommendations() {
  const recommendations = await getHomeRecommendations();

  return (
    <section
      id="recommendations"
      className={styles.recommendations}
      aria-labelledby="recommendations-title"
    >
      <div className={styles.recommendationCopy}>
        <h2 id="recommendations-title">
          Curly Joy
          <br />
          рекомендує <Heart />
        </h2>
        <p>
          Те, що ми спробували на собі.
          <br />
          Точніше — на наших собаках.
        </p>
        <Link
          className={styles.button}
          href={`/catalog?collection=${RECOMMENDATIONS_COLLECTION}`}
        >
          Дивитися всі товари <Icon name="arrow" />
        </Link>
      </div>
      <div className={styles.productResults}>
        {recommendations.length > 0 ? (
          <div className={styles.productGrid}>
            {recommendations.map((product) => (
              <ProductTile key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className={styles.emptyResults}>Добірка скоро з’явиться.</p>
        )}
      </div>
    </section>
  );
}

export function HomePromotions() {
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
            Дивитися новинки <Icon name="arrow" />
          </span>
        </div>
      </Link>
      <Link
        href="/catalog?collection=all-season"
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
            Дивитися <Icon name="arrow" />
          </span>
        </div>
      </Link>
      <Link
        href="/catalog?collection=dress-up"
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
            Дивитися <Icon name="arrow" />
          </span>
        </div>
      </Link>
    </section>
  );
}
