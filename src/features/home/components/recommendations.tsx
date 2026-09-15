import Image from "next/image";
import Link from "next/link";

import { getProducts } from "@/features/catalog/queries";
import { formatMoney } from "@/lib/money";

import styles from "../lifestyle.module.css";
import { Arrow, EditorialLink } from "./editorial-link";

export async function Recommendations() {
  const products = await getProducts({ collection: "curly-joy-recommends" });

  return (
    <section
      id="recommendations"
      className={styles.recommendations}
      aria-labelledby="recommendations-title"
    >
      <div className={styles.wrap}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.handwritten}>Нюхом чуємо хороші речі</p>
            <h2 id="recommendations-title" className={styles.sectionTitle}>
              Curly Joy рекомендує
            </h2>
            <p className={styles.sectionDescription}>
              Речі, які ми обираємо для життя з нашими собаками.
            </p>
          </div>
          <EditorialLink href="/collection/curly-joy-recommends">
            Уся добірка
          </EditorialLink>
        </div>
        <div className={styles.productGrid}>
          {products.slice(0, 4).map((product) => (
            <article key={product.id} className={styles.product}>
              <Link
                href={`/product/${product.slug}`}
                className={styles.productLink}
              >
                <div className={styles.productPhoto}>
                  {product.image.src ? (
                    <Image
                      src={product.image.src}
                      alt={product.image.alt}
                      fill
                      sizes="(max-width: 640px) 50vw, (min-width: 1440px) 310px, 25vw"
                    />
                  ) : (
                    <span className={styles.productPlaceholder}>
                      {product.title}
                    </span>
                  )}
                  <span className={styles.productArrow}>
                    <Arrow diagonal />
                  </span>
                </div>
                <p className={styles.productLine}>
                  {product.line ?? "Curly Joy Store"}
                </p>
                <h3>{product.title}</h3>
                <p className={styles.productPrice}>
                  {product.inStock
                    ? `від ${formatMoney(product.priceFrom)}`
                    : "Немає в наявності"}
                </p>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
