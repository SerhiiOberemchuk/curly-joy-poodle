import type { CSSProperties } from "react";

import type { ArtworkWindow } from "../reference-content";
import styles from "../reference.module.css";

/** Reuses the supplied artwork without baking the page's text or controls into images. */
export function ReferenceArtwork({
  window: [x, y, width, height],
  className = "",
}: {
  window: ArtworkWindow;
  className?: string;
}) {
  const style: CSSProperties = {
    aspectRatio: `${width} / ${height}`,
    backgroundSize: `${(1024 / width) * 100}% ${(1536 / height) * 100}%`,
    backgroundPosition: `${(x / (1024 - width)) * 100}% ${(y / (1536 - height)) * 100}%`,
  };

  return (
    <span
      aria-hidden="true"
      className={`${styles.artwork} ${className}`}
      style={style}
    />
  );
}
