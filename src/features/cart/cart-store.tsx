"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

import { calculateCart } from "./calculate";
import { writeBrowserCartCookie } from "./cart-cookie.client";
import type { Cart } from "./types";

interface CartState {
  cart: Cart | null;
  source: Cart | null;
  error: string | null;
  hydrate: (cart: Cart) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
}

export function createCartStore() {
  return createStore<CartState>()((set, get) => {
    function saveCookie() {
      const cart = get().cart;
      if (!cart) return;
      try {
        const result = writeBrowserCartCookie(
          get().source?.lines.map((line) => line.variantId) ?? [],
          cart.lines.map((line) => ({ p: line.variantId, q: line.quantity })),
        );
        if (result === "full") {
          set({ error: "У кошику забагато позицій. Оновіть сторінку й повторіть спробу." });
        } else if (result === "merged") {
          set({ error: "Кошик змінився в іншій вкладці. Оновіть сторінку, щоб перевірити товари." });
        } else if (result === "unavailable") {
          set({ error: "Не вдалося зберегти кошик у браузері. Дозвольте cookie та спробуйте ще раз." });
        }
      } catch {
        set({ error: "Не вдалося зберегти кошик у браузері. Дозвольте cookie та спробуйте ще раз." });
      }
    }

    return {
      cart: null,
      source: null,
      error: null,
      hydrate: (cart) => set({ cart, source: cart, error: null }),
      setQuantity: (variantId, quantity) => {
        const before = get().cart;
        set((state) => {
          const cart = state.cart;
          const line = cart?.lines.find((item) => item.variantId === variantId);
          if (!cart || !line || !Number.isSafeInteger(quantity)) return state;
          if (quantity < 1 || (line.maxQuantity !== null && quantity > line.maxQuantity))
            return state;
          if (quantity === line.quantity) return state;
          return {
            cart: calculateCart(
              cart.lines.map((item) =>
                item.variantId === variantId ? { ...item, quantity } : item,
              ),
              cart,
            ),
            error: null,
          };
        });
        if (get().cart !== before) saveCookie();
      },
      remove: (variantId) => {
        const before = get().cart;
        set((state) => {
          const cart = state.cart;
          if (!cart || !cart.lines.some((item) => item.variantId === variantId))
            return state;
          return {
            cart: calculateCart(
              cart.lines.filter((item) => item.variantId !== variantId),
              cart,
            ),
            error: null,
          };
        });
        if (get().cart !== before) saveCookie();
      },
    };
  });
}

const CartContext = createContext<ReturnType<typeof createCartStore> | null>(null);

export function CartStoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createCartStore);
  return <CartContext value={store}>{children}</CartContext>;
}

export function useCartStoreApi() {
  const store = useContext(CartContext);
  if (!store) throw new Error("CartStoreProvider is missing");
  return store;
}

export function useCartStore<T>(selector: (state: CartState) => T): T {
  return useStore(useCartStoreApi(), selector);
}
