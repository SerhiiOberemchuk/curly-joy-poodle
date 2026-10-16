"use client";

import Link from "next/link";

import { Icon } from "@/components/ui/icon";
import { useFavoritesStore } from "@/features/favorites/favorites";

import styles from "./site-header.module.css";

export function FavoritesLink() {
  const count = useFavoritesStore((state) => state.ids.length);

  return (
    <Link href="/favorites" className={styles.iconButton} aria-label={`Обране: ${count}`}>
      <Icon name="heart" />
      {count > 0 ? (
        <span className={styles.favoriteCount} aria-hidden="true">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
