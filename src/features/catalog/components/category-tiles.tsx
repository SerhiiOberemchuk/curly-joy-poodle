import Image from "next/image";
import Link from "next/link";

import { getCategories, getCategoryTiles } from "../queries";
import { readSearchQuery } from "../search";
import type { SearchParams } from "./sorted-product-list";
import styles from "./category-tiles.module.css";

/**
 * Picture tiles of the next category level. The catalog shows every top
 * category, wrapping onto new rows; a category shows its own subcategories
 * in one row that scrolls sideways. Hidden while the page answers a search.
 */
export async function CategoryTiles({
  activeSlug: activeSlugPromise,
  searchParams,
}: {
  activeSlug?: Promise<string>;
  searchParams: SearchParams;
}) {
  const [activeSlug, params, categories] = await Promise.all([
    activeSlugPromise,
    searchParams,
    getCategories(),
  ]);
  if (readSearchQuery(params.q)) return null;

  const parent = activeSlug
    ? categories.find((category) => category.slug === activeSlug)
    : null;
  if (activeSlug && !parent) return null;
  const tiles = await getCategoryTiles(parent?.id ?? null);
  if (tiles.length === 0) return null;

  return (
    <nav
      className={parent ? styles.row : styles.grid}
      aria-label={parent ? `Підкатегорії: ${parent.title}` : "Категорії каталогу"}
    >
      <ul>
        {tiles.map((tile) => (
          <li key={tile.id}>
            <Link href={`/catalog/${tile.slug}`} className={styles.tile}>
              <span className={styles.image} aria-hidden="true">
                {tile.coverUrl ? (
                  <Image src={tile.coverUrl} alt="" fill sizes="160px" />
                ) : null}
              </span>
              <span className={styles.title}>{tile.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
