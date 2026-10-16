"use client";

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
    store.getState().remove(line.variantId);
  }

  return (
    <div className={styles.lineControls}>
      <div className={styles.stepper} aria-label={`Кількість: ${line.title}`}>
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
        aria-label={`Видалити ${line.title}`}
        onClick={remove}
      >
        Видалити
      </button>
    </div>
  );
}
