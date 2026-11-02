import { createStore, type StateCreator } from "zustand/vanilla";
import { createJSONStorage, persist } from "zustand/middleware";
import { z } from "zod";

import { VIEWED_PRODUCTS_LIMIT, VIEWED_PRODUCTS_KEY, viewedProductIdSchema } from "./contract";

const savedSchema = z.object({ ids: z.array(viewedProductIdSchema).max(VIEWED_PRODUCTS_LIMIT) });
interface SavedHistory { ids: readonly string[] }
export interface ViewedProductsState extends SavedHistory {
  isHydrated: boolean;
  remember: (id: string) => void;
  clear: () => void;
}

/** IDs only, for this tab's visit. Prices and availability always come from the CRM. */
export function createViewedProductsStore(
  getStorage: () => Pick<Storage, "getItem" | "setItem" | "removeItem"> = () => window.sessionStorage,
) {
  const initializer: StateCreator<ViewedProductsState, [], [["zustand/persist", SavedHistory]]> =
    (set, get, api) => persist<ViewedProductsState, [], [], SavedHistory>(
      (persistSet) => ({
        ids: [],
        isHydrated: false,
        remember(id) {
          const parsed = viewedProductIdSchema.safeParse(id);
          if (!get().isHydrated || !parsed.success || get().ids[0] === parsed.data) return;
          persistSet((state) => ({
            ids: [parsed.data, ...state.ids.filter((previous) => previous !== parsed.data)].slice(0, VIEWED_PRODUCTS_LIMIT),
          }));
        },
        clear() {
          if (get().isHydrated) persistSet({ ids: [] });
        },
      }),
      {
        name: VIEWED_PRODUCTS_KEY,
        version: 1,
        skipHydration: true,
        partialize: ({ ids }) => ({ ids }),
        storage: createJSONStorage<SavedHistory>(() => ({
          // Optional history remains usable in memory when browser storage is blocked.
          getItem(name) { try { return getStorage().getItem(name); } catch { return null; } },
          setItem(name, value) { try { getStorage().setItem(name, value); } catch { /* Keep this visit in memory. */ } },
          removeItem(name) { try { getStorage().removeItem(name); } catch { /* No purchase depends on history. */ } },
        })),
        merge(stored, current) {
          const parsed = savedSchema.safeParse(stored);
          return { ...current, ids: parsed.success ? [...new Set(parsed.data.ids)] : [] };
        },
        onRehydrateStorage: () => () => { set({ isHydrated: true }); },
      },
    )(set, get, api);
  return createStore<ViewedProductsState>()(initializer);
}
