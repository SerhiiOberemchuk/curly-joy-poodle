"use client";

import { useSearchParams } from "next/navigation";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";

import { readSearchQuery } from "../search";
import styles from "./catalog-page.module.css";

/**
 * The search's own heading for `?q=`; nothing without a search. Its
 * `data-catalog-search` mark hides the page's heading and category tiles
 * (catalog-page.module.css), so the page sends those once, in its static
 * shell, and a search never duplicates them. The URL is read in the browser:
 * a search from the header shows this heading at once.
 */
export function SearchHeading() {
  const query = readSearchQuery(useSearchParams().get("q") ?? undefined);
  if (!query) return null;
  return (
    <div data-catalog-search>
      <div className={styles.crumbs}>
        <Breadcrumbs trail={[{ href: "/catalog", label: "Каталог" }]} current="Результати пошуку" />
      </div>
      <header className={`${styles.heading} ${styles.searchHeading}`}>
        <div>
          <p className={styles.eyebrow}>Каталог Curly Joy</p>
          <h1 id="catalog-search-title">Результати пошуку</h1>
          <p className={styles.searchQuery}>За запитом «{query}»</p>
        </div>
      </header>
    </div>
  );
}
