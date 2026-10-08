import Link from "next/link";

import { getCategories } from "../queries";
import styles from "./catalog-toolbar.module.css";

export async function CategoryChips({
  activeSlug: activeSlugPromise,
  filtered = false,
}: {
  activeSlug?: Promise<string>;
  filtered?: boolean;
}) {
  const [categories, activeSlug] = await Promise.all([getCategories(), activeSlugPromise]);

  return (
    <nav className={`${styles.chipsRow} ${styles.chips}`} aria-label="Категорії">
      <Link href="/catalog" className={activeSlug || filtered ? styles.chip : styles.chipActive}>
        Усі товари
      </Link>
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={`/catalog/${category.slug}`}
          className={activeSlug === category.slug ? styles.chipActive : styles.chip}
          aria-current={activeSlug === category.slug ? "page" : undefined}
        >
          {category.title}
        </Link>
      ))}
    </nav>
  );
}
