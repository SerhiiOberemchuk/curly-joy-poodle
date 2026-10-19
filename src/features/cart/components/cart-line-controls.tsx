"use client";

import { flushSync } from "react-dom";
import type { CartLine } from "../types";
import { useCartStoreApi } from "../cart-store";
import styles from "./cart-view.module.css";

export function CartLineControls({
  line,
}: {
  line: Pick<CartLine, "variantId" | "title" | "quantity" | "maxQuantity">;
}) {
  const store = useCartStoreApi();

  function changeQuantity(delta: number) {
    const current = store.getState().cart?.lines.find((item) => item.variantId === line.variantId);
    if (!current) return;
    store.getState().setQuantity(line.variantId, current.quantity + delta);
  }

  function remove() {
    const lines = store.getState().cart?.lines ?? [];
    const index = lines.findIndex((item) => item.variantId === line.variantId);
    const neighbour = lines[index + 1] ?? lines[index - 1];
    flushSync(() => store.getState().remove(line.variantId));
    if (store.getState().cart?.lines.some((item) => item.variantId === line.variantId))
      return; // The change was not saved and the line stays.
    // The removed line took the focused button with it.
    const next = [...document.querySelectorAll<HTMLElement>("[data-cart-remove]")]
      .find((button) => button.dataset.cartRemove === neighbour?.variantId);
    (next ?? document.getElementById("cart-title"))?.focus();
  }

  return (
    <div className={styles.lineControls}>
      <div className={styles.stepper} role="group" aria-label={`Кількість: ${line.title}`}>
        <button
          type="button"
          className={styles.stepperButton}
          aria-label={`Зменшити кількість: ${line.title}`}
          onClick={() => changeQuantity(-1)}
          disabled={line.quantity <= 1}
        >
          −
        </button>
        <span className={styles.stepperValue}>{line.quantity}</span>
        <button
          type="button"
          className={styles.stepperButton}
          aria-label={`Збільшити кількість: ${line.title}`}
          onClick={() => changeQuantity(1)}
          disabled={line.maxQuantity !== null && line.quantity >= line.maxQuantity}
        >
          +
        </button>
      </div>
      <button
        type="button"
        className={styles.remove}
        data-cart-remove={line.variantId}
        aria-label={`Видалити ${line.title}`}
        onClick={remove}
      >
        Видалити
      </button>
    </div>
  );
}
