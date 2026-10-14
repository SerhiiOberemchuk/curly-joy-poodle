"use client";

import { useState } from "react";

import type { ProductImage } from "../types";
import { ProductArtwork } from "./product-artwork";
import { videoSource } from "../video";
import styles from "./product-gallery.module.css";

export function ProductGallerySkeleton() {
  return (
    <div className={styles.gallery}>
      <ProductArtwork image={{ src: null, alt: "" }} size="lg" decorative />
    </div>
  );
}

export function ProductGallery({
  images,
  videos = [],
}: {
  images: readonly ProductImage[];
  videos?: readonly string[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex] ?? images[0];

  return (
    <div className={styles.gallery}>
      <ProductArtwork image={active} size="lg" />

      {images.length > 1 ? (
        <div
          className={styles.thumbs}
          role="group"
          aria-label="Зображення товару"
        >
          {images.map((image, index) => (
            <button
              key={image.src ?? index}
              type="button"
              className={
                index === activeIndex ? styles.thumbActive : styles.thumb
              }
              aria-pressed={index === activeIndex}
              aria-label={`${image.alt} — фото ${index + 1}`}
              onClick={() => setActiveIndex(index)}
            >
              <ProductArtwork image={image} size="sm" decorative />
            </button>
          ))}
        </div>
      ) : null}
      {videos.length > 0 ? (
        <div className={styles.videos}>
          {videos.map((url, index) => {
            const source = videoSource(url);
            if (!source) return null;
            const title = `Відео товару ${index + 1}`;
            return (
              <details className={styles.video} key={url}>
                <summary>
                  <span aria-hidden="true">▷</span> {title}
                </summary>
                {source.kind === "embed" ? (
                  <iframe
                    src={source.src}
                    title={title}
                    loading="lazy"
                    allow="fullscreen; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                ) : source.kind === "file" ? (
                  <video
                    src={source.src}
                    controls
                    muted
                    preload="none"
                    aria-label={title}
                  >
                    <a href={source.src}>Відкрити {title.toLowerCase()}</a>
                  </video>
                ) : (
                  <a
                    className={styles.videoLink}
                    href={source.src}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Переглянути відео ↗
                  </a>
                )}
              </details>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
