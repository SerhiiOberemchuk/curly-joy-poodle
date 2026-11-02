import Link from "next/link";
import type { ReactNode } from "react";

import { Icon } from "./icon";
import styles from "./breadcrumbs.module.css";

type CatalogLevel = "/catalog" | `/catalog/${string}`;

/**
 * Where the page sits in the shop, from home to the page itself. On phones
 * only home and the parent remain: the current page is already the heading.
 */
export function Breadcrumbs({
  trail = [],
  current,
}: {
  /** The levels between home and this page: the catalog and its categories. */
  trail?: ReadonlyArray<{ href: CatalogLevel; label: ReactNode }>;
  current: ReactNode;
}) {
  return (
    <nav aria-label="Навігаційний ланцюжок" className={styles.nav}>
      <ol className={styles.list}>
        <li>
          <Link href="/" className={styles.home}>
            <Icon name="home" />
            <span className={styles.homeLabel}>Головна</span>
          </Link>
        </li>
        {trail.map((item) => (
          <li key={item.href} className={styles.level}>
            <Link href={item.href}>{item.label}</Link>
          </li>
        ))}
        <li aria-current="page" className={styles.current}>
          {current}
        </li>
      </ol>
    </nav>
  );
}
