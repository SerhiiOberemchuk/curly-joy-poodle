"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

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

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener("favorites-change", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("favorites-change", listener);
  };
}

function readStoredFavorites() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const stored = useSyncExternalStore(
    subscribe,
    readStoredFavorites,
    () => "[]",
  );
  const ids = useMemo((): string[] => {
    try {
      const parsed: unknown = JSON.parse(stored);
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string")
        : [];
    } catch {
      return [];
    }
  }, [stored]);

  function toggle(productId: string) {
    const next = ids.includes(productId)
      ? ids.filter((id) => id !== productId)
      : [...ids, productId];
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("favorites-change"));
    } catch {
      /* Storage may be disabled in the visitor's browser. */
    }
  }

  return (
    <FavoritesContext value={{ ids, toggle }}>{children}</FavoritesContext>
  );
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
