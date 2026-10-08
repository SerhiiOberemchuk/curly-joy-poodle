"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import type { ProductVariant } from "@/features/catalog/types";

import { initialCartActionState } from "../action-state";
import { addToCartAction } from "../actions";
import { MAX_LINE_QUANTITY } from "../constants";
import styles from "./add-to-cart-form.module.css";

export function AddToCartForm({
  optionName,
  variants,
}: {
  /** What the variant labels name, e.g. «Розмір». */
  optionName: string;
  variants: readonly ProductVariant[];
}) {
  const [state, formAction, isPending] = useActionState(addToCartAction, initialCartActionState);
  const [variantId, setVariantId] = useState<string | null>(
    () => variants.find((variant) => variant.inStock)?.id ?? null,
  );
  const [quantity, setQuantity] = useState(1);

  const selected = variants.find((variant) => variant.id === variantId);
  const pricedVariant = selected ?? variants[0];
  const ceiling = Math.min(selected?.stock ?? MAX_LINE_QUANTITY, MAX_LINE_QUANTITY);
  const soldOut = variants.every((variant) => !variant.inStock);

  function handleVariantChange(next: string) {
    setVariantId(next);
    setQuantity(1);
  }

  return (
    <form action={formAction} className={styles.form}>
      <input type="hidden" name="variantId" value={variantId ?? ""} />
      <input type="hidden" name="quantity" value={quantity} />

      {pricedVariant ? (
        <div className={styles.priceRow}>
          <Price amount={pricedVariant.price} compareAtAmount={pricedVariant.compareAtPrice} size="lg" />
          <span className={styles.stock}>{soldOut ? "Немає в наявності" : "У наявності"}</span>
        </div>
      ) : null}

      {/* A single variant needs no picker — one option next to a "how to
          measure" link would only be noise. */}
      {variants.length > 1 ? (
        <fieldset>
          <legend className={styles.fieldLabel}>
            <span>{optionName}</span>
            {optionName === "Розмір" ? (
              <Link href="/info/sizes" className={styles.sizeHint}>
                Як виміряти?
              </Link>
            ) : null}
          </legend>

          <div className={styles.sizes}>
            {variants.map((variant) => {
              const unavailable = !variant.inStock;
              const active = variant.id === variantId;

              return (
                <button
                  key={variant.id}
                  type="button"
                  disabled={unavailable}
                  aria-pressed={active}
                  className={
                    unavailable ? styles.sizeDisabled : active ? styles.sizeActive : styles.size
                  }
                  onClick={() => handleVariantChange(variant.id)}
                >
                  {variant.label ?? variant.sku}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

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
        ) : selected && selected.stock !== null && selected.stock <= 3 ? (
          <span className={styles.stock}>
            Залишилось {selected.stock} шт.{variants.length > 1 ? " цього варіанта" : ""}
          </span>
        ) : null}
      </p>
    </form>
  );
}
