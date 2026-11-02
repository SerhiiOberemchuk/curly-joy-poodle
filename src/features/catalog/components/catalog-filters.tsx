"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";

import { Icon } from "@/components/ui/icon";

import {
  activeFilterCount,
  filterSections,
  type FilterFacets,
  type ProductFilters,
} from "../filtering";
import styles from "./catalog-toolbar.module.css";

export interface CategoryLink {
  href: "/catalog" | `/catalog/${string}`;
  title: string;
  active: boolean;
}

/**
 * The filter column beside the catalog list. A section appears only when the
 * current products differ in it: one brand needs no brand filter. On phones
 * the column folds behind a «Фільтри» button.
 */
export function CatalogFilters({
  facets,
  filters,
  categories,
  onChange,
  onReset,
}: {
  facets: FilterFacets;
  filters: ProductFilters;
  categories: readonly CategoryLink[];
  onChange: (next: Partial<ProductFilters>) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const active = activeFilterCount(filters);
  const sections = filterSections(facets);

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
        Фільтри{active ? ` (${active})` : ""}
        <Icon name="chevronDown" className={styles.toggleChevron} />
      </button>

      <div id={panelId} className={styles.filtersPanel} data-open={open || undefined}>
        {categories.length > 0 ? (
          <nav className={styles.filterGroup} aria-labelledby={`${panelId}-categories`}>
            <p className={styles.filterTitle} id={`${panelId}-categories`}>
              Категорії
            </p>
            <ul className={styles.categoryList}>
              {categories.map((category) => (
                <li key={category.href}>
                  <Link
                    href={category.href}
                    className={category.active ? styles.categoryActive : styles.category}
                    aria-current={category.active ? "page" : undefined}
                  >
                    {category.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        {sections.brands ? (
          <fieldset className={styles.filterGroup}>
            <legend className={styles.filterTitle}>Бренд</legend>
            {facets.brands.map((brand) => {
              const checked = filters.brands.includes(brand.name);
              return (
                <label key={brand.name} className={styles.check}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      onChange({
                        brands: checked
                          ? filters.brands.filter((name) => name !== brand.name)
                          : [...filters.brands, brand.name],
                      })
                    }
                  />
                  <span>{brand.name}</span>
                  <span className={styles.checkCount}>{brand.count}</span>
                </label>
              );
            })}
          </fieldset>
        ) : null}

        {sections.price && facets.priceRange ? (
          <PriceFilter
            // A new range or a reset from elsewhere starts a fresh draft.
            key={`${filters.minPrice}-${filters.maxPrice}`}
            range={facets.priceRange}
            min={filters.minPrice}
            max={filters.maxPrice}
            onApply={(minPrice, maxPrice) => onChange({ minPrice, maxPrice })}
          />
        ) : null}

        {sections.inStock || sections.sale ? (
          <fieldset className={styles.filterGroup}>
            <legend className={styles.filterTitle}>Наявність і ціни</legend>
            {sections.inStock ? (
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={filters.inStockOnly}
                  onChange={(event) => onChange({ inStockOnly: event.target.checked })}
                />
                <span>Лише в наявності</span>
              </label>
            ) : null}
            {sections.sale ? (
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={filters.saleOnly}
                  onChange={(event) => onChange({ saleOnly: event.target.checked })}
                />
                <span>Зі знижкою</span>
                <span className={styles.checkCount}>{facets.onSale}</span>
              </label>
            ) : null}
          </fieldset>
        ) : null}

        {active > 0 ? (
          <button type="button" className={styles.reset} onClick={onReset}>
            Скинути фільтри
          </button>
        ) : null}
      </div>
    </aside>
  );
}

function PriceFilter({
  range,
  min,
  max,
  onApply,
}: {
  range: { min: number; max: number };
  min: number | null;
  max: number | null;
  onApply: (min: number | null, max: number | null) => void;
}) {
  const id = useId();
  const [from, setFrom] = useState(min === null ? "" : String(min));
  const [to, setTo] = useState(max === null ? "" : String(max));

  function read(value: string): number | null {
    const number = Number.parseInt(value, 10);
    return Number.isFinite(number) && number >= 0 ? number : null;
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const low = read(from);
    const high = read(to);
    // Typed the wrong way round: still the range the buyer meant.
    if (low !== null && high !== null && low > high) onApply(high, low);
    else onApply(low, high);
  }

  return (
    <form className={styles.filterGroup} onSubmit={submit}>
      <fieldset>
        <legend className={styles.filterTitle}>Ціна, ₴</legend>
        <div className={styles.priceRow}>
          <label className="visually-hidden" htmlFor={`${id}-from`}>
            Ціна від, гривень
          </label>
          <input
            id={`${id}-from`}
            className={styles.priceInput}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder={String(range.min)}
            value={from}
            onChange={(event) => setFrom(event.target.value.replace(/\D/g, ""))}
          />
          <span aria-hidden="true">—</span>
          <label className="visually-hidden" htmlFor={`${id}-to`}>
            Ціна до, гривень
          </label>
          <input
            id={`${id}-to`}
            className={styles.priceInput}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder={String(range.max)}
            value={to}
            onChange={(event) => setTo(event.target.value.replace(/\D/g, ""))}
          />
          <button type="submit" className={styles.priceApply}>
            OK
          </button>
        </div>
      </fieldset>
    </form>
  );
}
