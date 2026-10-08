import Form from "next/form";

import { Icon } from "@/components/ui/icon";

import styles from "./site-header.module.css";

/**
 * Catalog search. A plain GET form to /catalog?q=…, so it works without
 * JavaScript; `next/form` turns it into a client-side navigation when JS is on.
 */
export function SiteSearch() {
  return (
    <Form action="/catalog" className={styles.search} role="search">
      <input
        type="search"
        name="q"
        aria-label="Пошук товарів"
        placeholder="Пошук товарів…"
        maxLength={100}
        enterKeyHint="search"
      />
      <button type="submit" aria-label="Шукати">
        <Icon name="search" />
      </button>
    </Form>
  );
}
