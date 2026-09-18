import Link from "next/link";

import { getCategories } from "../queries";
import styles from "./catalog-toolbar.module.css";

export async function CategoryChips({
  activeSlug,
  filtered = false,
}: {
  activeSlug?: string;
  filtered?: boolean;
}) {
  const categories = await getCategories();

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
          {category.glyph} {category.title}
        </Link>
      ))}
    </nav>
  );
}
