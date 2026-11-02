import type { Metadata } from "next";
import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { getCollection, getProducts } from "@/features/catalog/queries";
import { FavoriteProducts } from "@/features/favorites/favorite-products";
import { RECOMMENDATIONS_COLLECTION } from "@/features/home/queries";
import styles from "./favorites.module.css";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Улюблені товари",
  description: "Товари Curly Joy, які ви зберегли сердечком.",
};

export default async function FavoritesPage() {
  const [products, curated] = await Promise.all([
    getProducts(),
    getCollection(RECOMMENDATIONS_COLLECTION).catch(() => null),
  ]);

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Ваш особистий список</p>
        <h1 id="favorites-title" tabIndex={-1}>Улюблені <span aria-hidden="true">♡</span></h1>
        <p>Зберігайте те, до чого хочеться повернутися. Список зберігається в цьому браузері.</p>
        {/* The merchant's own selection once it exists in the CRM. */}
        {curated ? (
          <Link
            href={`/collection/${curated.slug}`}
            className={buttonStyles({ size: "lg", className: styles.cta })}
          >
            Обрано Curly Joy <Icon name="arrow" />
          </Link>
        ) : (
          <Link href="/catalog" className={buttonStyles({ size: "lg", className: styles.cta })}>
            Перейти до каталогу <Icon name="arrow" />
          </Link>
        )}
      </header>
      <section className={styles.products} aria-label="Збережені товари">
        <FavoriteProducts products={products} />
      </section>
    </div>
  );
}
