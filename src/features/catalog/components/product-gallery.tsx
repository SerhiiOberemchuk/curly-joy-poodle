"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";

import { Icon } from "@/components/ui/icon";
import surfaceMotion from "@/components/ui/surface-motion.module.css";

import type { ProductImage } from "../types";
import { ProductArtwork } from "./product-artwork";
import { getProductThumbnail } from "./product-photo-preview";
import { videoSource } from "../video";
import styles from "./product-gallery.module.css";

function GalleryPhotos({
  images,
  index,
  fullscreen = false,
}: {
  images: readonly ProductImage[];
  index: number;
  fullscreen?: boolean;
}) {
  const [thumbnail, setThumbnail] = useState(() => getProductThumbnail(images[0]?.src));
  const [slide, setSlide] = useState<{
    index: number;
    previous: number | null;
    status: "loading" | "ready" | "error";
  }>({
    index,
    previous: null,
    status: "loading",
  });
  const image = images[index];
  if (slide.index !== index) {
    const alreadyLoaded = slide.previous === index && thumbnail?.original !== image?.src;
    const previous = slide.status === "ready" || thumbnail?.original === images[slide.index]?.src
      ? slide.index
      : slide.previous;
    setSlide({
      index,
      previous: previous === index ? null : previous,
      status: alreadyLoaded ? "ready" : "loading",
    });
  }

  function settle(status: "ready" | "error") {
    setSlide((current) => current.index === index ? { ...current, status } : current);
    if (status === "ready" && index === 0) setThumbnail(null);
  }

  if (!image) return null;
  const previewSrc = thumbnail?.original === image.src ? thumbnail?.url : undefined;
  const previous = slide.previous;
  return (
    <div className={styles.photos} data-gallery-photos="">
      <div
        key={index}
        className={styles.currentPhoto}
        data-fade={previous !== null || undefined}
        data-waiting={(previous !== null && slide.status === "loading" && !previewSrc) || undefined}
      >
        <ProductArtwork
          image={slide.status === "error" && !previewSrc ? { ...image, src: null } : image}
          size="lg"
          fullscreen={fullscreen}
          previewSrc={previewSrc}
          onLoad={() => settle("ready")}
          onError={() => settle("error")}
        />
      </div>
      {previous !== null ? (
        <div key={previous} className={styles.previousPhoto} aria-hidden="true">
          <ProductArtwork
            image={images[previous]}
            size="lg"
            fullscreen={fullscreen}
            decorative
            previewSrc={thumbnail?.original === images[previous].src ? thumbnail?.url : undefined}
            onLoad={thumbnail?.original === images[previous].src ? () => setThumbnail(null) : undefined}
          />
        </div>
      ) : null}
    </div>
  );
}

function GalleryControls({ index, count, step }: {
  index: number;
  count: number;
  step: (delta: number) => void;
}) {
  if (count < 2) return null;
  return (
    <>
      <button type="button" className={`${styles.arrow} ${styles.arrowPrev}`} aria-label="Попереднє фото" onClick={() => step(-1)}>
        <Icon name="chevronLeft" />
      </button>
      <button type="button" className={`${styles.arrow} ${styles.arrowNext}`} aria-label="Наступне фото" onClick={() => step(1)}>
        <Icon name="chevronRight" />
      </button>
      <p className={styles.counter} aria-live="polite">
        <span className="visually-hidden">Фото </span>
        {index + 1} / {count}
      </p>
    </>
  );
}

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
  const [viewerOpened, setViewerOpened] = useState(false);
  const count = images.length;
  const thumbsRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDialogElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);

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

  const swipeHandlers = {
    onPointerDown(event: PointerEvent) {
      swipeStart.current = event.isPrimary && event.pointerType === "touch"
        ? { x: event.clientX, y: event.clientY }
        : null;
    },
    onPointerCancel() {
      swipeStart.current = null;
    },
    onPointerUp(event: PointerEvent) {
      const start = swipeStart.current;
      swipeStart.current = null;
      if (!start || count < 2) return;
      const x = event.clientX - start.x;
      const y = event.clientY - start.y;
      if (Math.abs(x) > 40 && Math.abs(x) > Math.abs(y)) step(x < 0 ? 1 : -1);
    },
  };

  return (
    <div className={styles.gallery}>
      <div
        className={styles.stage}
        data-product-gallery-photo=""
        data-sold-out={soldOut || undefined}
        {...swipeHandlers}
      >
        <GalleryPhotos images={images} index={activeIndex} />
        {overlay}
        <GalleryControls index={activeIndex} count={count} step={step} />
        {images[activeIndex]?.src ? (
          <button
            ref={openRef}
            type="button"
            className={styles.expand}
            aria-label="Відкрити фото на весь екран"
            aria-haspopup="dialog"
            onClick={() => {
              setViewerOpened(true);
              viewerRef.current?.showModal();
            }}
          >
            <Icon name="expand" />
          </button>
        ) : null}
      </div>

      <dialog
        ref={viewerRef}
        className={`${styles.viewer} ${surfaceMotion.layer}`}
        aria-label="Повноекранний перегляд фото товару"
        onClose={() => openRef.current?.focus({ preventScroll: true })}
        onKeyDown={(event) => {
          if (count < 2 || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
          event.preventDefault();
          step(event.key === "ArrowLeft" ? -1 : 1);
        }}
      >
        <button type="button" className={styles.close} aria-label="Закрити повноекранний перегляд" onClick={() => viewerRef.current?.close()}>
          <Icon name="close" />
        </button>
        {viewerOpened ? (
          <div className={styles.viewerStage} {...swipeHandlers}>
            <GalleryPhotos images={images} index={activeIndex} fullscreen />
            <GalleryControls index={activeIndex} count={count} step={step} />
          </div>
        ) : null}
      </dialog>

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
