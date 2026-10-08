import Image from "next/image";

import type { ProductImage } from "../types";
import styles from "./product-artwork.module.css";

/** Product photo from the CRM, with a neutral stand-in until one is uploaded. */
export function ProductArtwork({
  image,
  size = "md",
}: {
  image: ProductImage;
  size?: "sm" | "md" | "lg";
}) {
  if (image.src) {
    return (
      <div className={`${styles.artwork} ${styles.photo} ${styles[size]}`}>
        <Image
          src={image.src}
          alt={image.alt}
          fill
          loading={size === "lg" ? "eager" : "lazy"}
          sizes={
            size === "sm"
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
      role="img"
      aria-label={image.alt}
    >
      <span className={styles.glyph} aria-hidden="true">
        🐾
      </span>
    </div>
  );
}
