import Image from "next/image";
import Link from "next/link";

import { homeImages } from "../content";
import styles from "./home.module.css";

const collections = [
  {
    title: "Всі продукти",
    href: "/catalog",
    image: homeImages.allProducts,
    description:
      "Для маленьких радощів і великих пригод. Одяг та аксесуари GF PET® для вашого улюбленця.",
  },
  {
    title: "Літня колекція",
    href: "/catalog?collection=summer",
    image: homeImages.summer,
    description:
      "Легкість і прохолода у спекотні дні. Все для довгих прогулянок та подорожей разом.",
  },
  {
    title: "Зимова колекція",
    href: "/catalog?collection=winter",
    image: homeImages.winter,
    description:
      "Тепло, комфорт і надійний захист під час кожної прогулянки в холодну пору.",
  },
] as const;

export function CollectionShowcase() {
  return (
    <section
      className={`container ${styles.section}`}
      aria-labelledby="collections-title"
    >
      <div className={styles.sectionHeading}>
        <h2 id="collections-title">Всі категорії</h2>
        <Link href="/catalog" className={styles.textLink}>
          До каталогу <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <div className={styles.collectionGrid}>
        {collections.map((collection) => (
          <Link
            key={collection.href}
            href={collection.href}
            className={styles.collectionCard}
          >
            <Image
              src={collection.image}
              alt=""
              fill
              sizes={
                collection.href === "/catalog"
                  ? "(max-width: 1200px) 100vw, 1152px"
                  : "(max-width: 700px) 100vw, 576px"
              }
            />
            <div className={styles.collectionContent}>
              <h3>{collection.title}</h3>
              <p>{collection.description}</p>
              <span className={styles.collectionLink}>
                Детальніше <span aria-hidden="true">↗</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
