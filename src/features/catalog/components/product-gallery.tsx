"use client";

import { useRef, useState, type ReactNode } from "react";

import { Icon } from "@/components/ui/icon";

import type { ProductImage } from "../types";
import { ProductArtwork } from "./product-artwork";
import { videoSource } from "../video";
import styles from "./product-gallery.module.css";

export function ProductGallery({
  images,
  videos = [],
  overlay,
  soldOut = false,
}: {
  images: readonly ProductImage[];
  videos?: readonly string[];
  /** Badges and the heart, laid over the photo's corners. */
  overlay?: ReactNode;
  /** No variant can be bought: the photo fades like the card's. */
  soldOut?: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex] ?? images[0];
  const count = images.length;
  const thumbsRef = useRef<HTMLDivElement>(null);
  const swipeStart = useRef<number | null>(null);

  function show(index: number) {
    setActiveIndex(index);
    // Keep the active thumbnail in the strip's view; only the strip scrolls, never the page.
    const strip = thumbsRef.current;
    const thumb = strip?.children[index] as HTMLElement | undefined;
    if (strip && thumb) {
      strip.scrollTo({
        left: thumb.offsetLeft - (strip.clientWidth - thumb.offsetWidth) / 2,
        behavior: "smooth",
      });
    }
  }
  const step = (delta: number) => show((activeIndex + delta + count) % count);

  return (
    <div className={styles.gallery}>
      <div
        className={styles.stage}
        data-sold-out={soldOut || undefined}
        // A sideways swipe on a touch screen turns the photos like the arrows.
        onPointerDown={(event) => {
          swipeStart.current = event.pointerType === "touch" ? event.clientX : null;
        }}
        onPointerUp={(event) => {
          const start = swipeStart.current;
          swipeStart.current = null;
          if (start === null || count < 2) return;
          const distance = event.clientX - start;
          if (Math.abs(distance) > 40) step(distance < 0 ? 1 : -1);
        }}
      >
        <ProductArtwork image={active} size="lg" />
        {overlay}
        {count > 1 ? (
          <>
            <button
              type="button"
              className={`${styles.arrow} ${styles.arrowPrev}`}
              aria-label="Попереднє фото"
              onClick={() => step(-1)}
            >
              <Icon name="chevronLeft" />
            </button>
            <button
              type="button"
              className={`${styles.arrow} ${styles.arrowNext}`}
              aria-label="Наступне фото"
              onClick={() => step(1)}
            >
              <Icon name="chevronRight" />
            </button>
            <p className={styles.counter} aria-live="polite">
              <span className="visually-hidden">Фото </span>
              {activeIndex + 1} / {count}
            </p>
          </>
        ) : null}
      </div>

      {count > 1 ? (
        <div
          ref={thumbsRef}
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
              onClick={() => show(index)}
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
