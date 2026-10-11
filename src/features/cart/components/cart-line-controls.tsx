"use client";

import { useActionState } from "react";

import { initialCartActionState } from "../action-state";
import { removeLineAction, setLineQuantityAction } from "../actions";
import type { CartLine } from "../types";
import styles from "./cart-view.module.css";

/**
 * Plain forms posting straight to Server Actions: quantity changes keep working
 * before hydration and without JavaScript, and the server stays the only source
 * of truth for stock. A change the server refuses — the CRM could not confirm
 * stock — is reported next to the line instead of replacing the page.
 */
export function CartLineControls({
  line,
}: {
  line: Pick<CartLine, "variantId" | "title" | "quantity" | "maxQuantity">;
}) {
  const [state, quantityAction, isPending] = useActionState(
    setLineQuantityAction,
    initialCartActionState,
  );
  const ceiling = line.maxQuantity;

  return (
    <>
      <div className={styles.lineControls}>
        <div className={styles.stepper}>
          <QuantityButton
            action={quantityAction}
            line={line}
            quantity={line.quantity - 1}
            label="Зменшити кількість"
            symbol="−"
            disabled={isPending || line.quantity <= 1}
          />
          <span className={styles.stepperValue}>{line.quantity}</span>
          <QuantityButton
            action={quantityAction}
            line={line}
            quantity={line.quantity + 1}
            label="Збільшити кількість"
            symbol="+"
            disabled={
              isPending || (ceiling !== null && line.quantity >= ceiling)
            }
          />
        </div>

        <form action={removeLineAction}>
          <input type="hidden" name="variantId" value={line.variantId} />
          <button
            type="submit"
            className={styles.remove}
            aria-label={`Видалити ${line.title}`}
          >
            Видалити
          </button>
        </form>
      </div>
      {state.status === "error" ? (
        <p className={styles.lineError} role="alert">
          {state.message}
        </p>
      ) : null}
    </>
  );
}

function QuantityButton({
  action,
  line,
  quantity,
  label,
  symbol,
  disabled,
}: {
  action: (formData: FormData) => void;
  line: Pick<CartLine, "variantId" | "title">;
  quantity: number;
  label: string;
  symbol: string;
  disabled: boolean;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="variantId" value={line.variantId} />
      <input type="hidden" name="quantity" value={quantity} />
      <button
        type="submit"
        className={styles.stepperButton}
        aria-label={`${label}: ${line.title}`}
        disabled={disabled}
      >
        {symbol}
      </button>
    </form>
  );
}
