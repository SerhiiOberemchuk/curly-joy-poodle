"use client";

import { createContext, useContext, useEffect, useId, useMemo, useState, type ReactNode } from "react";
import useSWR from "swr";
import { useStore } from "zustand";

import { ProductShelf, ProductShelfSkeleton } from "@/features/catalog/components/product-shelf";

import { getViewedProductsAction } from "./actions";
import { createViewedProductsStore, type ViewedProductsState } from "./store";
import styles from "./viewed-products.module.css";

const ViewedProductsContext = createContext<ReturnType<typeof createViewedProductsStore> | null>(null);

function useViewedProducts<T>(selector: (state: ViewedProductsState) => T): T {
  const store = useContext(ViewedProductsContext);
  if (!store) throw new Error("ViewedProductsProvider is required");
  return useStore(store, selector);
}

export function ViewedProductsProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createViewedProductsStore);
  useEffect(() => { void store.persist.rehydrate(); }, [store]);
  return <ViewedProductsContext value={store}>{children}</ViewedProductsContext>;
}

export function RecordViewedProduct({ productId }: { productId: string }) {
  const ready = useViewedProducts((state) => state.isHydrated);
  const remember = useViewedProducts((state) => state.remember);
  useEffect(() => { if (ready) remember(productId); }, [ready, remember, productId]);
  return null;
}

export function RecentlyViewedProducts({ currentProductId }: { currentProductId?: string }) {
  const headingId = useId();
  const ids = useViewedProducts((state) => state.ids);
  const clear = useViewedProducts((state) => state.clear);
  const requested = useMemo(() => ids.filter((id) => id !== currentProductId), [ids, currentProductId]);
  const key = requested.length > 0 ? ["recently-viewed-products", requested] as const : null;
  const { data, error } = useSWR(key, async ([, productIds]) => {
    const result = await getViewedProductsAction(productIds);
    if (!result.ok) throw new Error("Viewed products unavailable");
    return result.items;
  }, { revalidateOnFocus: false, errorRetryCount: 1 });

  if (requested.length === 0 || error || data?.length === 0) return null;
  return (
    <section className={styles.section} aria-labelledby={headingId} aria-busy={!data}>
      <header className={styles.heading}>
        <h2 id={headingId}>Ви переглядали</h2>
        <button type="button" onClick={clear} className={styles.clear}>Очистити історію</button>
      </header>
      {/* The history is known once the tab's storage is read: hold the shelf's
          room while today's catalog resolves it. */}
      {data ? (
        <ProductShelf products={data} label="Переглянуті товари" />
      ) : (
        <ProductShelfSkeleton count={requested.length} />
      )}
    </section>
  );
}
