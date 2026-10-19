"use client";

import { sortOptions, type SortOption } from "../sorting";
import styles from "./catalog-toolbar.module.css";

/** A native select: the browser handles keyboard, focus and screen readers. */
export function SortSelect({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (value: SortOption) => void;
}) {
  return (
    <label className={styles.sort}>
      <span className={styles.sortLabel}>Сортування</span>
      <span className={styles.selectWrap}>
        <select
          className={styles.select}
          value={value}
          onChange={(event) => {
            const next = sortOptions.find((option) => option.value === event.target.value);
            if (next) onChange(next.value);
          }}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg className={styles.chevron} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="m3 6 5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </label>
  );
}
