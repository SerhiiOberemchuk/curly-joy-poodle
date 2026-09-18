"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import type { ProductVariant, SizeCode } from "@/features/catalog/types";

import { initialCartActionState } from "../action-state";
import { addToCartAction } from "../actions";
import { MAX_LINE_QUANTITY } from "../constants";
import styles from "./add-to-cart-form.module.css";

export function AddToCartForm({
  productId,
  variants,
}: {
  productId: string;
  variants: readonly ProductVariant[];
}) {
  const [state, formAction, isPending] = useActionState(addToCartAction, initialCartActionState);
  const [size, setSize] = useState<SizeCode | null>(
    () => variants.find((variant) => variant.stock > 0)?.size ?? null,
  );
  const [quantity, setQuantity] = useState(1);

  const selected = variants.find((variant) => variant.size === size);
  const pricedVariant = selected ?? variants[0];
  const ceiling = Math.min(selected?.stock ?? MAX_LINE_QUANTITY, MAX_LINE_QUANTITY);
  const soldOut = variants.every((variant) => variant.stock === 0);

  function handleSizeChange(next: SizeCode) {
    setSize(next);
    setQuantity(1);
  }

  return (
    <form action={formAction} className={styles.form}>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="size" value={size ?? ""} />
      <input type="hidden" name="quantity" value={quantity} />

      {pricedVariant ? (
        <div className={styles.priceRow}>
          <Price amount={pricedVariant.price} compareAtAmount={pricedVariant.compareAtPrice} size="lg" />
          <span className={styles.stock}>{soldOut ? "Немає в наявності" : "У наявності"}</span>
        </div>
      ) : null}

      <fieldset>
        <legend className={styles.fieldLabel}>
          <span>Розмір</span>
          <Link href="/info/sizes" className={styles.sizeHint}>
            Як виміряти?
          </Link>
        </legend>

        <div className={styles.sizes}>
          {variants.map((variant) => {
            const unavailable = variant.stock === 0;
            const active = variant.size === size;

            return (
              <button
                key={variant.sku}
                type="button"
                disabled={unavailable}
                aria-pressed={active}
                className={
                  unavailable ? styles.sizeDisabled : active ? styles.sizeActive : styles.size
                }
                onClick={() => handleSizeChange(variant.size)}
              >
                {variant.size}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className={styles.row}>
        <div className={styles.stepper}>
          <button
            type="button"
            className={styles.stepperButton}
            aria-label="Зменшити кількість"
            disabled={quantity <= 1}
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
          >
            −
          </button>
          <span className={styles.stepperValue} aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            className={styles.stepperButton}
            aria-label="Збільшити кількість"
            disabled={quantity >= ceiling}
            onClick={() => setQuantity((value) => Math.min(ceiling, value + 1))}
          >
            +
          </button>
        </div>

        <Button type="submit" size="lg" className={styles.submit} disabled={isPending || soldOut}>
          {soldOut ? "Немає в наявності" : isPending ? "Додаємо…" : "Додати в кошик"}
        </Button>
      </div>

      <p aria-live="polite" role="status">
        {state.status === "error" ? (
          <span className={styles.statusError}>{state.message}</span>
        ) : state.status === "success" ? (
          <span className={styles.statusSuccess}>
            ✓ {state.message} ·{" "}
            <Link href="/cart" className={styles.statusLink}>
              Перейти до кошика
            </Link>
          </span>
        ) : selected && selected.stock <= 3 ? (
          <span className={styles.stock}>Залишилось {selected.stock} шт. цього розміру</span>
        ) : null}
      </p>
    </form>
  );
}
