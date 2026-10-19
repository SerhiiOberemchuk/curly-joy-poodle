import { createStore, type StateCreator } from "zustand/vanilla";
import { persist } from "zustand/middleware";

import {
  createFavoritesStorage,
  FAVORITES_STORAGE_KEY,
  type SavedFavorites,
} from "./favorites-storage";

export interface FavoritesState extends SavedFavorites {
  isHydrated: boolean;
  storageError: string | null;
  toggle: (productId: string) => void;
}

export function createFavoritesStore(
  getStorage: () => Pick<Storage, "getItem" | "setItem" | "removeItem"> = () => window.localStorage,
) {
  const initializer: StateCreator<
    FavoritesState,
    [],
    [["zustand/persist", SavedFavorites]]
  > = (set, get, api) => persist<FavoritesState, [], [], SavedFavorites>(
    (persistSet) => ({
      ids: [],
      isHydrated: false,
      storageError: null,
      toggle(productId) {
        if (!get().isHydrated || !productId.trim()) return;
        persistSet((state) => ({
          ids: state.ids.includes(productId)
            ? state.ids.filter((id) => id !== productId)
            : [...state.ids, productId],
        }));
      },
    }),
    {
      name: FAVORITES_STORAGE_KEY,
      version: 1,
      skipHydration: true,
      partialize: ({ ids }) => ({ ids }),
      storage: createFavoritesStorage(getStorage, (storageError) => {
        // Transient feedback must not trigger another persistence write.
        if (get().storageError !== storageError) set({ storageError });
      }),
      onRehydrateStorage: () => (_state, error) => {
        set({
          isHydrated: true,
          storageError: error
            ? "Не вдалося завантажити обране з браузера. Перевірте, чи браузер дозволяє сайту зберігати дані."
            : null,
        });
      },
    },
  )(set, get, api);

  return createStore<FavoritesState>()(initializer);
}
