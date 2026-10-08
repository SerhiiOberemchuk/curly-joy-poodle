"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { Icon } from "@/components/ui/icon";

/** Favourites live in this browser only — there are no customer accounts. */
const STORAGE_KEY = "curly-joy-favorites";

interface Favorites {
  /** Product ids, in the order they were saved. */
  ids: readonly string[];
  toggle: (productId: string) => void;
}

const FavoritesContext = createContext<Favorites | null>(null);

export function useFavorites(): Favorites {
  const favorites = useContext(FavoritesContext);
  if (!favorites) throw new Error("useFavorites requires FavoritesProvider");
  return favorites;
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
      if (Array.isArray(parsed)) {
        setIds(parsed.filter((item): item is string => typeof item === "string"));
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }, [ids, loaded]);

  function toggle(productId: string) {
    setIds((current) =>
      current.includes(productId)
        ? current.filter((item) => item !== productId)
        : [...current, productId],
    );
  }

  return <FavoritesContext value={{ ids, toggle }}>{children}</FavoritesContext>;
}

/** The heart on a product tile. */
export function FavoriteToggle({
  productId,
  productTitle,
  className,
}: {
  productId: string;
  productTitle: string;
  className?: string;
}) {
  const { ids, toggle } = useFavorites();
  const selected = ids.includes(productId);

  return (
    <button
      className={className}
      type="button"
      aria-pressed={selected}
      aria-label={`${selected ? "Прибрати з обраного" : "Додати до обраного"}: ${productTitle}`}
      onClick={() => toggle(productId)}
    >
      <Icon name="heart" />
    </button>
  );
}
