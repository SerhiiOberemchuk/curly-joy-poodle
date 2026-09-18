"use client";

import { useEffect, useId, useRef, useState } from "react";

import { sortOptions, type SortOption } from "../sorting";
import styles from "./catalog-toolbar.module.css";

export function SortSelect({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (value: SortOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, sortOptions.findIndex((option) => option.value === value)),
  );
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selected = sortOptions.find((option) => option.value === value) ?? sortOptions[0];

  useEffect(() => {
    if (!open) return;

    function closeOnOutsideClick(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.focus();
  }, [activeIndex, open]);

  function handleChange(next: SortOption) {
    setOpen(false);
    onChange(next);
  }

  function openMenu() {
    setActiveIndex(Math.max(0, sortOptions.findIndex((option) => option.value === value)));
    setOpen(true);
  }

  function handleButtonKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const selectedIndex = Math.max(
        0,
        sortOptions.findIndex((option) => option.value === value),
      );
      if (event.key === "End") setActiveIndex(sortOptions.length - 1);
      else if (event.key === "ArrowUp") setActiveIndex(Math.max(0, selectedIndex - 1));
      else
        setActiveIndex(
          event.key === "Home" ? 0 : Math.min(sortOptions.length - 1, selectedIndex + 1),
        );
      setOpen(true);
    }
  }

  function handleOptionKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(
        event.key === "ArrowDown"
          ? (index + 1) % sortOptions.length
          : (index - 1 + sortOptions.length) % sortOptions.length,
      );
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setActiveIndex(event.key === "Home" ? 0 : sortOptions.length - 1);
    }
  }

  return (
    <div className={styles.sort} ref={rootRef}>
      <span className={styles.sortLabel}>Сортування</span>
      <button
        type="button"
        className={styles.selectTrigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={handleButtonKeyDown}
      >
        <span>{selected.label}</span>
        <svg className={styles.chevron} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="m3 6 5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <div id={listboxId} className={styles.selectMenu} role="listbox" aria-label="Сортування товарів">
          {sortOptions.map((option, index) => (
            <button
              key={option.value}
              ref={(node) => { optionRefs.current[index] = node; }}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={styles.selectOption}
              onClick={() => handleChange(option.value)}
              onKeyDown={(event) => handleOptionKeyDown(event, index)}
            >
              <span>{option.label}</span>
              {option.value === value ? (
                <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="m3 8 3 3 7-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
