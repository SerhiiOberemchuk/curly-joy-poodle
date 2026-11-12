import Image from "next/image";
import Link from "next/link";

import { Icon } from "@/components/ui/icon";

import { getCatalogMenu } from "../menu.server";
import { CatalogMenuPopover } from "./catalog-menu-popover";
import styles from "./catalog-menu.module.css";

/** The panel's id: its buttons in the header open it with `popoverTarget`. */
export const CATALOG_MENU_ID = "catalog-menu";

/**
 * The header's drop-down catalog: the whole catalog, new arrivals, sale and
 * live collections beside the top categories with a photo each and their
 * subcategories. Cached data, rendered into every page, so its links are in
 * the HTML and the panel opens with no request.
 */
export async function CatalogMenu() {
  const menu = await getCatalogMenu();
  const titleId = `${CATALOG_MENU_ID}-title`;

  return (
    <CatalogMenuPopover id={CATALOG_MENU_ID} className={styles.panel}>
      <button
        type="button"
        popoverTarget={CATALOG_MENU_ID}
        popoverTargetAction="hide"
        className={styles.close}
        aria-label="Закрити каталог"
      >
        <Icon name="close" />
      </button>
      <nav className={styles.inner} aria-labelledby={titleId}>
        <div className={styles.aside}>
          <p id={titleId} className={styles.title}>
            Каталог <span aria-hidden="true">♡</span>
          </p>
          <ul className={styles.quickLinks}>
            <li>
              <Link href="/catalog" className={styles.allLink}>
                Усі товари <Icon name="arrow" />
              </Link>
            </li>
            <li>
              <Link href="/catalog?sort=newest" className={styles.quickLink}>
                Новинки
              </Link>
            </li>
            {menu?.hasSale ? (
              <li>
                <Link href="/catalog?sale=true" className={styles.quickLink}>
                  Зі знижкою
                </Link>
              </li>
            ) : null}
          </ul>
          {menu?.collections.length ? (
            <>
              <p id={`${CATALOG_MENU_ID}-collections`} className={styles.groupTitle}>
                Добірки
              </p>
              <ul className={styles.quickLinks} aria-labelledby={`${CATALOG_MENU_ID}-collections`}>
                {menu.collections.map((collection) => (
                  <li key={collection.slug}>
                    <Link href={`/collection/${collection.slug}`} className={styles.quickLink}>
                      {collection.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>

        {menu?.categories.length ? (
          <ul className={styles.categories}>
            {menu.categories.map((category) => (
              <li key={category.slug} className={styles.category}>
                <Link href={`/catalog/${category.slug}`} className={styles.categoryLink}>
                  <span className={styles.cover} aria-hidden="true">
                    {category.coverUrl ? (
                      <Image
                        src={category.coverUrl}
                        alt=""
                        fill
                        sizes="(width <= 1100px) 45vw, 220px"
                      />
                    ) : null}
                  </span>
                  <span className={styles.categoryTitle}>
                    {category.title}
                    <Icon name="arrow" />
                  </span>
                </Link>
                {category.children.length > 0 ? (
                  <ul className={styles.children} aria-label={`Підкатегорії: ${category.title}`}>
                    {category.children.map((child) => (
                      <li key={child.slug}>
                        <Link href={`/catalog/${child.slug}`}>{child.title}</Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </nav>
    </CatalogMenuPopover>
  );
}
