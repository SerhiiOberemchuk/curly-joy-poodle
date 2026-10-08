import type { Metadata } from "next";
import Link from "next/link";

import { getProducts } from "@/features/catalog/queries";
import { FavoriteProducts } from "@/features/favorites/favorite-products";
import styles from "./favorites.module.css";

export const metadata: Metadata = {
  title: "Улюблені товари",
  description: "Товари Curly Joy, які ви зберегли сердечком.",
};

export default async function FavoritesPage() {
  const products = await getProducts();

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Ваш особистий список</p>
        <h1>Улюблені <span aria-hidden="true">♡</span></h1>
        <p>Зберігайте те, до чого хочеться повернутися. Список зберігається в цьому браузері.</p>
        <Link href="/#recommendations">До рекомендацій <span aria-hidden="true">→</span></Link>
      </header>
      <section className={styles.products} aria-label="Збережені товари">
        <FavoriteProducts products={products} />
      </section>
    </div>
  );
}
