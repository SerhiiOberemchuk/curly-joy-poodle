"use client";

import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";

import { readSearchQuery } from "../search";
import styles from "./catalog-page.module.css";

export interface CatalogHeadingProps {
  title: string;
  eyebrow: string;
  description: string;
  /** A category or collection: the catalog is its parent in the trail. */
  nested: boolean;
}

/** The page's own heading: the static shell's, and the one without a search. */
export function CatalogHeading({ title, eyebrow, description, nested }: CatalogHeadingProps) {
  return (
    <>
      <div className={styles.crumbs}>
        <Breadcrumbs trail={nested ? [{ href: "/catalog", label: "Каталог" }] : []} current={title} />
      </div>
      <header className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 id="catalog-title">{title}</h1>
        </div>
        <p className={styles.description}>{description}</p>
      </header>
    </>
  );
}

function SearchHeading({ query }: { query: string }) {
  return (
    <>
      <div className={styles.crumbs}>
        <Breadcrumbs trail={[{ href: "/catalog", label: "Каталог" }]} current="Результати пошуку" />
      </div>
      <header className={`${styles.heading} ${styles.searchHeading}`}>
        <div>
          <p className={styles.eyebrow}>Каталог Curly Joy</p>
          <h1 id="catalog-title">Результати пошуку</h1>
          <p className={styles.searchQuery}>За запитом «{query}»</p>
        </div>
      </header>
    </>
  );
}

function useSearchQuery() {
  return readSearchQuery(useSearchParams().get("q") ?? undefined);
}

/**
 * Swaps in the search's own heading for `?q=`. The URL is read in the
 * browser, so a search from the header shows it at once; a direct visit gets
 * it with the first streamed bytes (`CatalogHeading` is the fallback).
 */
export function SearchAwareHeading(props: CatalogHeadingProps) {
  const query = useSearchQuery();
  return query ? <SearchHeading query={query} /> : <CatalogHeading {...props} />;
}

/** Content a search hides: the category tiles answer browsing, not a query. */
export function HiddenWhileSearching({ children }: { children: ReactNode }) {
  return useSearchQuery() ? null : children;
}
