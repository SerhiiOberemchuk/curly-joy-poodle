"use client";

import { useRef } from "react";

import { Icon } from "@/components/ui/icon";

import type { ProductListItem } from "../types";
import { ProductCard, ProductCardSkeleton } from "./product-card";
import styles from "./product-shelf.module.css";

/** The shelf's frame while its products load: the cards and the arrow row. */
export function ProductShelfSkeleton({ count }: { count: number }) {
  return (
    <div className={styles.shelf} aria-hidden="true">
      <div className={styles.track}>
        {Array.from({ length: count }, (_, index) => (
          <div key={index}>
            <ProductCardSkeleton />
          </div>
        ))}
      </div>
      {count > 2 ? <div className={`${styles.controls} ${styles.controlsSkeleton}`} /> : null}
    </div>
  );
}

/**
 * A row of product cards that scrolls sideways: suggestions that should not
 * push the rest of the page down. Swipe, scroll or use the arrow buttons.
 */
export function ProductShelf({
  products,
  label,
}: {
  products: readonly ProductListItem[];
  /** Names the list for assistive technology; the visible heading sits outside. */
  label: string;
}) {
  const trackRef = useRef<HTMLUListElement>(null);

  function scroll(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: "smooth" });
  }

  return (
    <div className={styles.shelf}>
      <ul ref={trackRef} className={styles.track} aria-label={label}>
        {products.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
      {products.length > 2 ? (
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.control}
            aria-label="Попередні товари"
            onClick={() => scroll(-1)}
          >
            <Icon name="chevronLeft" />
          </button>
          <button
            type="button"
            className={styles.control}
            aria-label="Наступні товари"
            onClick={() => scroll(1)}
          >
            <Icon name="chevronRight" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
