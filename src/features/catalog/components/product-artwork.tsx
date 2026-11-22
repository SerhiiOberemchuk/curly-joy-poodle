import Image from "next/image";

import type { ProductImage } from "../types";
import styles from "./product-artwork.module.css";

/** Product photo from the CRM, with a neutral stand-in until one is uploaded. */
export function ProductArtwork({
  image,
  size = "md",
  decorative = false,
  previewSrc,
  onLoad,
  onError,
  fullscreen = false,
}: {
  image: ProductImage;
  size?: "sm" | "md" | "lg";
  /** Set where the product's name is already next to the picture (cards, cart lines, labelled buttons). */
  decorative?: boolean;
  /** The clicked card's already loaded image while the gallery photo decodes. */
  previewSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
  fullscreen?: boolean;
}) {
  if (image.src) {
    return (
      <div
        className={`${styles.artwork} ${styles.photo} ${styles[size]}`}
        style={previewSrc ? { backgroundImage: `url("${previewSrc}")` } : undefined}
      >
        <Image
          src={image.src}
          alt={decorative ? "" : image.alt}
          fill
          style={previewSrc ? { opacity: 0 } : undefined}
          onLoad={onLoad}
          onError={onError}
          loading={size === "lg" && !fullscreen ? "eager" : "lazy"}
          // The product page's main photo is its largest paint.
          fetchPriority={size === "lg" && !fullscreen ? "high" : undefined}
          sizes={
            fullscreen
              ? "100vw"
              : size === "sm"
              ? "80px"
              : size === "lg"
                ? "(max-width: 768px) 100vw, 600px"
                : "(max-width: 640px) 50vw, 300px"
          }
        />
      </div>
    );
  }

  return (
    <div
      className={`${styles.artwork} ${styles[size]}`}
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": image.alt })}
    >
      <span className={styles.glyph} aria-hidden="true">
        🐾
      </span>
    </div>
  );
}
