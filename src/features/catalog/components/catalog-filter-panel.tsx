"use client";

import { useId, useState, type ReactNode } from "react";

import { Icon } from "@/components/ui/icon";

import styles from "./catalog-toolbar.module.css";

/** Navigation and the toggle remain usable while filter data streams. */
export function CatalogFilterPanel({ children, count }: { children: ReactNode; count: ReactNode }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <aside className={styles.filters} aria-label="Фільтри товарів">
      <button
        type="button"
        className={styles.filtersToggle}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
      >
        <Icon name="filter" />
        Фільтри{count}
        <Icon name="chevronDown" className={styles.toggleChevron} />
      </button>
      <div id={panelId} className={styles.filtersPanel} data-open={open || undefined}>
        {children}
      </div>
    </aside>
  );
}
