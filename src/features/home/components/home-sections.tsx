import Image from "next/image";
import Link from "next/link";

import { Icon } from "@/components/ui/icon";
import { getDisplayCartTerms } from "@/features/checkout/cart-terms.server";
import { formatMoney } from "@/lib/money";

import styles from "../home.module.css";
import { getCollectionSlugs } from "@/features/catalog/queries";
import { ProductGrid } from "@/features/catalog/components/product-grid";
import { getHomeCategories, getHomeRecommendations } from "../queries";

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
            Переглянути категорії
          </Link>
        </div>
      </div>
    </section>
  );
}

const benefits = [
  {
    icon: "paw",
    title: "Перевірені товари",
    description: "Те, чим користуємося самі",
  },
  {
    icon: "heart",
    title: "Допоможемо з вибором",
    description: "У робочі дні",
  },
  { icon: "leaf", title: "Турбота про собак", description: "і їхніх людей" },
] as const;

export function HomeBenefits({
  freeShippingThreshold = null,
}: {
  freeShippingThreshold?: number | null;
}) {
  const shipping =
    freeShippingThreshold === null
      ? {
          icon: "truck" as const,
          title: "Доставка по Україні",
          description: "Новою поштою",
        }
      : {
          icon: "truck" as const,
          title: "Безкоштовна доставка",
          description:
            freeShippingThreshold === 0
              ? "Для всіх замовлень"
              : `Від ${formatMoney(freeShippingThreshold)} суми товарів`,
        };
  return (
    <ul className={styles.benefits} aria-label="Переваги Curly Joy">
      {[benefits[0], shipping, ...benefits.slice(1)].map((benefit) => (
        <li key={benefit.title}>
          <Icon name={benefit.icon} />
          <div>
            <strong>{benefit.title}</strong>
            {/* The CRM's offer streams in: its room is held while it does. */}
            <span className={benefit === shipping ? styles.offerText : undefined}>
              {benefit.description}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export async function HomeBenefitsWithTerms() {
  const terms = await getDisplayCartTerms().catch(() => null);
  return <HomeBenefits freeShippingThreshold={terms?.freeShippingThreshold} />;
}

export async function HomeCategories() {
  const categories = await getHomeCategories();

  return (
    <section
      id="categories"
      className={styles.categories}
      aria-labelledby="categories-title"
    >
      <div className={styles.sectionHead}>
        <div>
          <h2 id="categories-title">
            Життя із собакою <Heart />
          </h2>
          <p>Оберіть категорію та знайдіть те, що потрібно вашій собаці.</p>
        </div>
      </div>
      {/* A row that scrolls sideways once there are more categories than fit. */}
      <ul className={styles.categoryRow}>
        {categories.map((category) => (
          <li key={category.id}>
            <Link
              href={`/catalog/${category.slug}`}
              className={styles.categoryCard}
            >
              <span className={styles.categoryImage} aria-hidden="true">
                {category.coverUrl ? (
                  <Image
                    src={category.coverUrl}
                    alt=""
                    fill
                    sizes="(max-width: 900px) 50vw, 380px"
                  />
                ) : null}
              </span>
              <span className={styles.categoryCaption}>
                <span className={styles.categoryTitle}>{category.title}</span>
                <span className={styles.categoryArrow} aria-hidden="true">
                  <Icon name="arrow" />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export async function HomeRecommendations() {
  const { products: recommendations, catalogHref } =
    await getHomeRecommendations();
  const cta =
    catalogHref === "/catalog" ? "Переглянути каталог" : "Переглянути добірку";

  return (
    <section
      className={styles.recommendations}
      aria-labelledby="recommendations-title"
    >
      <div className={styles.sectionHead}>
        <div>
          <h2 id="recommendations-title">
            Товари для собак <Heart />
          </h2>
          <p>Для прогулянок, подорожей і затишних днів удома.</p>
        </div>
        <Link className={styles.button} href={catalogHref}>
          {cta} <Icon name="arrow" />
        </Link>
      </div>
      {recommendations.length > 0 ? (
        <>
          <ProductGrid products={recommendations} wide />
          <div className={styles.sectionFoot}>
            <Link className={styles.button} href={catalogHref}>
              До каталогу <Icon name="arrow" />
            </Link>
          </div>
        </>
      ) : (
        <p className={styles.emptyResults}>Зараз немає товарів для показу.</p>
      )}
    </section>
  );
}

/** Invites shops, groomers and clinics to the wholesale programme (/business). */
export function HomeBusiness() {
  return (
    <section className={styles.business} aria-labelledby="business-title">
      <div className={styles.businessCopy}>
        <p className={styles.eyebrow}>Для бізнесу</p>
        <h2 id="business-title">Хочете стати партнером Curly Joy?</h2>
        <p>
          Зоомагазинам, грумерам, ветклінікам і розплідникам — оптові ціни на
          товари, які ми обираємо й перевіряємо самі. Залиште заявку, і менеджер
          зв’яжеться з вами, щоб узгодити умови.
        </p>
      </div>
      <Link className={styles.button} href="/business">
        Заповнити заявку <Icon name="arrow" />
      </Link>
    </section>
  );
}

export async function HomePromotions() {
  // A tile opens its collection page while the CRM has it live, else the catalog.
  const live = new Set(
    await getCollectionSlugs().catch((): readonly string[] => []),
  );
  return (
    <section
      className={styles.promotions}
      aria-label="Більше натхнення для життя разом"
    >
      <Link
        href="/catalog?sort=newest"
        className={`${styles.promo} ${styles.newPromo}`}
      >
        <Image
          src="/images/home/promo-new-v2.webp"
          alt=""
          fill
          sizes="(max-width: 900px) calc(100vw - 28px), (min-width: 1600px) 510px, 33vw"
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
        href={live.has("all-season") ? "/collection/all-season" : "/catalog"}
        className={`${styles.promo} ${styles.seasonPromo}`}
      >
        <Image
          src="/images/home/promo-season-v2.webp"
          alt=""
          fill
          sizes="(max-width: 900px) calc(100vw - 28px), (min-width: 1600px) 510px, 33vw"
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
        href={live.has("dress-up") ? "/collection/dress-up" : "/catalog"}
        className={`${styles.promo} ${styles.dressPromo}`}
      >
        <Image
          src="/images/home/promo-together-v2.webp"
          alt=""
          fill
          sizes="(max-width: 900px) calc(100vw - 28px), (min-width: 1600px) 510px, 33vw"
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
