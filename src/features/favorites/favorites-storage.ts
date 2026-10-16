import type { PersistStorage } from "zustand/middleware";
import { z } from "zod";

export const FAVORITES_STORAGE_KEY = "curly-joy-favorites";

export interface SavedFavorites {
  ids: readonly string[];
}

const savedFavoritesSchema = z.union([
  // The original storefront stored a bare array under the same key.
  z.array(z.unknown()).transform((ids) => ({ ids })),
  z.object({
    state: z.object({ ids: z.array(z.unknown()) }),
    version: z.literal(1),
  }).transform(({ state }) => state),
]);

const WRITE_ERROR = "Обране оновлено лише в цій вкладці. Браузер не дозволив зберегти зміни.";

/** Compatibility boundary between legacy localStorage data and Zustand persist. */
export function createFavoritesStorage(
  getStorage: () => Pick<Storage, "getItem" | "setItem" | "removeItem">,
  onWriteError: (error: string | null) => void,
): PersistStorage<SavedFavorites> {
  return {
    getItem(name) {
      const value = getStorage().getItem(name);
      // Rehydrating after another tab clears storage must also clear this store.
      if (value === null) return { state: { ids: [] }, version: 1 };
      const parsed: unknown = JSON.parse(value);
      const { ids } = savedFavoritesSchema.parse(parsed);
      return {
        state: {
          ids: [...new Set(ids.filter((id): id is string =>
            typeof id === "string" && id.trim().length > 0,
          ))],
        },
        version: 1,
      };
    },
    setItem(name, value) {
      try {
        getStorage().setItem(name, JSON.stringify(value));
        onWriteError(null);
      } catch {
        onWriteError(WRITE_ERROR);
      }
    },
    removeItem(name) {
      try {
        getStorage().removeItem(name);
        onWriteError(null);
      } catch {
        onWriteError(WRITE_ERROR);
      }
    },
  };
}
