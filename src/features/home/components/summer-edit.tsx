import Image from "next/image";
import Link from "next/link";

import { summerCategories } from "../content";
import styles from "./home.module.css";

export function SummerEdit() {
  return (
    <section
      className={`container ${styles.summerSection}`}
      aria-labelledby="summer-title"
    >
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.eyebrow}>Сонце. Прогулянки. Ви разом.</p>
          <h2 id="summer-title">Все для щасливого літа</h2>
        </div>
        <Link href="/catalog?collection=summer" className={styles.textLink}>
          Літня колекція <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <div className={styles.productGrid}>
        {summerCategories.map((category) => (
          <Link
            key={category.slug}
            href={`/product/${category.slug}`}
            className={styles.productCard}
          >
            <div className={styles.productImage}>
              <Image
                src={category.image}
                alt={`${category.title} GF PET`}
                fill
                sizes="(max-width: 700px) 50vw, (max-width: 1000px) 33vw, 190px"
              />
            </div>
            <p className={styles.productLine}>{category.line}</p>
            <h3>{category.title}</h3>
            <span className={styles.productArrow} aria-hidden="true">
              ↗
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
