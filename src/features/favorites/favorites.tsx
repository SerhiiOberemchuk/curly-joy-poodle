"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { useStore } from "zustand";

import { Icon } from "@/components/ui/icon";

import { FAVORITES_STORAGE_KEY } from "./favorites-storage";
import { createFavoritesStore, type FavoritesState } from "./favorites-store";
import styles from "./favorites.module.css";

const FavoritesContext = createContext<ReturnType<typeof createFavoritesStore> | null>(null);

export function useFavoritesStore<T>(selector: (state: FavoritesState) => T): T {
  const store = useContext(FavoritesContext);
  if (!store) throw new Error("useFavoritesStore requires FavoritesProvider");
  return useStore(store, selector);
}

function FavoritesStorageNotice() {
  const error = useFavoritesStore((state) => state.storageError);
  return <div role="status" className={error ? styles.notice : undefined}>{error}</div>;
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(createFavoritesStore);

  useEffect(() => {
    function syncStorage(event: StorageEvent) {
      if (event.key !== FAVORITES_STORAGE_KEY && event.key !== null) return;
      try {
        if (event.storageArea !== window.localStorage) return;
      } catch {
        return;
      }
      void store.persist.rehydrate();
    }

    window.addEventListener("storage", syncStorage);
    void store.persist.rehydrate();
    return () => window.removeEventListener("storage", syncStorage);
  }, [store]);

  return (
    <FavoritesContext value={store}>
      {children}
      <FavoritesStorageNotice />
    </FavoritesContext>
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
  const selected = useFavoritesStore((state) => state.ids.includes(productId));
  const toggle = useFavoritesStore((state) => state.toggle);
  const isHydrated = useFavoritesStore((state) => state.isHydrated);

  return (
    <button
      className={className}
      type="button"
      disabled={!isHydrated}
      aria-pressed={selected}
      aria-label={`${selected ? "Прибрати з обраного" : "Додати до обраного"}: ${productTitle}`}
      onClick={() => toggle(productId)}
    >
      <Icon name="heart" />
    </button>
  );
}
