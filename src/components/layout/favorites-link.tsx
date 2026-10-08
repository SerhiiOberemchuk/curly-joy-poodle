"use client";

import Link from "next/link";

import { Icon } from "@/components/ui/icon";
import { useFavorites } from "@/features/favorites/favorites";

import styles from "./site-header.module.css";

export function FavoritesLink() {
  const { ids } = useFavorites();

  return (
    <Link href="/favorites" className={styles.iconButton} aria-label={`Обране: ${ids.length}`}>
      <Icon name="heart" />
      {ids.length > 0 ? (
        <span className={styles.favoriteCount} aria-hidden="true">
          {ids.length}
        </span>
      ) : null}
    </Link>
  );
}
