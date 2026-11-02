"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type RefObject } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Price } from "@/components/ui/price";
import type { ProductVariant } from "@/features/catalog/types";

import { initialCartActionState } from "../action-state";
import { addToCartAction } from "../actions";
import { maxQuantityForVariant } from "../quantity";
import styles from "./add-to-cart-form.module.css";

export function AddToCartForm({
  title,
  optionName,
  variants,
}: {
  /** Named in the phone's buy bar, which shows once the form is off screen. */
  title: string;
  /** What the variant labels name, e.g. «Розмір». */
  optionName: string;
  variants: readonly ProductVariant[];
}) {
  const [state, formAction, isPending] = useActionState(addToCartAction, initialCartActionState);
  const [variantId, setVariantId] = useState<string | null>(
    () => variants.find((variant) => variant.inStock)?.id ?? null,
  );
  const [requestedQuantity, setQuantity] = useState(1);
  // The variant of the last request: «in the cart» belongs to it alone.
  const [sentVariant, setSentVariant] = useState<string | null>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const barVisible = useScrolledPast(actionsRef);

  const selected = variants.find((variant) => variant.id === variantId)
    ?? variants.find((variant) => variant.inStock);
  const pricedVariant = selected ?? variants[0];
  const ceiling = selected ? maxQuantityForVariant(selected) : 0;
  const soldOut = ceiling === 0;
  const quantity = soldOut ? 0 : ceiling === null ? requestedQuantity : Math.min(requestedQuantity, ceiling);
  const added = !isPending && state.status === "success" && sentVariant === selected?.id;

  function handleVariantChange(next: string) {
    setVariantId(next);
    setQuantity(1);
  }

  function changeQuantity(next: number) {
    setQuantity(next);
    setSentVariant(null);
  }

  return (
    <form
      action={formAction}
      className={styles.form}
      onSubmit={() => setSentVariant(selected?.id ?? null)}
    >
      <input type="hidden" name="variantId" value={selected?.id ?? ""} />
      <input type="hidden" name="quantity" value={quantity} />

      {pricedVariant ? (
        <div className={styles.priceRow}>
          <Price amount={pricedVariant.price} compareAtAmount={pricedVariant.compareAtPrice} size="lg" />
          <p className={soldOut ? styles.stockOut : styles.stockIn}>
            <span aria-hidden="true" className={styles.stockDot} />
            {soldOut ? "Немає в наявності" : selected && selected.stock !== null
              ? `У наявності: ${selected.stock} шт.`
              : "У наявності"}
          </p>
          <p className={styles.sku}>Артикул: {pricedVariant.sku}</p>
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
              const active = variant.id === selected?.id;

              return (
                <button
                  key={variant.id}
                  type="button"
                  disabled={unavailable || isPending}
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

      <div className={styles.row} ref={actionsRef}>
        {soldOut ? null : (
          <div className={styles.stepper} role="group" aria-label="Кількість">
            <button
              type="button"
              className={styles.stepperButton}
              aria-label="Зменшити кількість"
              disabled={isPending || quantity <= 1}
              onClick={() => changeQuantity(Math.max(1, quantity - 1))}
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
              disabled={isPending || (ceiling !== null && quantity >= ceiling)}
              onClick={() => changeQuantity(ceiling === null ? quantity + 1 : Math.min(ceiling, quantity + 1))}
            >
              +
            </button>
          </div>
        )}

        {added ? (
          // Takes over the focus of the button it replaces.
          <Link href="/cart" className={styles.inCart} autoFocus>
            <Icon name="check" />
            В кошику — перейти
          </Link>
        ) : (
          <Button type="submit" size="lg" className={styles.submit} disabled={isPending || soldOut}>
            {soldOut ? "Немає в наявності" : isPending ? "Додаємо…" : "Додати в кошик"}
          </Button>
        )}
      </div>

      <p aria-live="polite" role="status">
        {state.status === "error" ? (
          <span className={styles.statusError}>{state.message}</span>
        ) : added ? (
          <span className="visually-hidden">{state.message}</span>
        ) : null}
      </p>

      {/* Phones: price and the buy button stay at hand while reading below. */}
      {soldOut || !pricedVariant ? null : (
        <div
          className={styles.buyBar}
          data-buy-bar
          data-visible={barVisible || undefined}
          inert={!barVisible}
        >
          <div className={styles.buyBarCopy}>
            <span className={styles.buyBarTitle}>{title}</span>
            <strong>
              <Price amount={pricedVariant.price} compareAtAmount={pricedVariant.compareAtPrice} size="sm" />
            </strong>
          </div>
          {added ? (
            <Link href="/cart" className={styles.buyBarInCart}>
              <Icon name="check" />
              У кошику
            </Link>
          ) : (
            <button type="submit" className={styles.buyBarButton} disabled={isPending}>
              <Icon name="cartAdd" />
              Купити
            </button>
          )}
        </div>
      )}
    </form>
  );
}

/** True once the element has scrolled up and out of the viewport. */
function useScrolledPast(ref: RefObject<HTMLElement | null>) {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      setPast(!entry.isIntersecting && entry.boundingClientRect.bottom < 0);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return past;
}
