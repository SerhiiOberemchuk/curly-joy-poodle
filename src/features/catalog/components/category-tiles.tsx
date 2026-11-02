import Image from "next/image";
import Link from "next/link";

import { getCategories, getCategoryTiles } from "../queries";
import styles from "./category-tiles.module.css";

/**
 * Picture tiles of the next category level. The catalog shows every top
 * category, wrapping onto new rows; a category shows its own subcategories
 * in one row that scrolls sideways. Cached data: part of the static shell.
 */
export async function CategoryTiles({ parentSlug }: { parentSlug?: string }) {
  const parent = parentSlug
    ? (await getCategories()).find((category) => category.slug === parentSlug)
    : null;
  if (parentSlug && !parent) return null;
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
