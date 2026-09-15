"use client";

import { useState } from "react";

import type { ProductImage } from "../types";
import { ProductArtwork } from "./product-artwork";
import styles from "./product-gallery.module.css";

export function ProductGallery({ images }: { images: readonly ProductImage[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex] ?? images[0];

  return (
    <div className={styles.gallery}>
      <ProductArtwork image={active} size="lg" />

      {images.length > 1 ? (
        <div className={styles.thumbs} role="group" aria-label="Зображення товару">
          {images.map((image, index) => (
            <button
              key={image.alt}
              type="button"
              className={index === activeIndex ? styles.thumbActive : styles.thumb}
              aria-pressed={index === activeIndex}
              aria-label={image.alt}
              onClick={() => setActiveIndex(index)}
            >
              <ProductArtwork image={image} size="sm" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
