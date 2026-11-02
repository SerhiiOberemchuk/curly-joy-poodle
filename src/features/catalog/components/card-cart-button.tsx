"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Icon } from "@/components/ui/icon";
import { initialCartActionState } from "@/features/cart/action-state";
import { addToCartAction } from "@/features/cart/actions";

import styles from "./product-card.module.css";

/**
 * The cart button in a card's corner. A product with one variant goes into
 * the cart right here (the server re-checks stock); one with sizes or colours
 * opens its page, where the buyer picks the variant.
 */
export function CardCartButton({
  variantId,
  title,
  href,
}: {
  variantId: string | null;
  title: string;
  href: `/product/${string}`;
}) {
  if (!variantId) {
    return (
      <Link href={href} className={styles.cartButton} aria-label={`Обрати варіант: ${title}`}>
        <Icon name="cartAdd" />
      </Link>
    );
  }
  return <QuickAdd variantId={variantId} title={title} />;
}

function QuickAdd({ variantId, title }: { variantId: string; title: string }) {
  const [state, formAction, isPending] = useActionState(
    addToCartAction,
    initialCartActionState,
  );

  return (
    <div className={styles.cartAction}>
      {state.status === "success" ? (
        <Link
          href="/cart"
          // Takes over the focus of the button it replaces.
          autoFocus
          className={styles.cartButtonAdded}
          aria-label={`${title} — у кошику. Перейти до кошика`}
        >
          <Icon name="check" />
        </Link>
      ) : (
        <form action={formAction}>
          <input type="hidden" name="variantId" value={variantId} />
          <input type="hidden" name="quantity" value="1" />
          <button
            type="submit"
            className={styles.cartButton}
            disabled={isPending}
            aria-label={`Додати в кошик: ${title}`}
          >
            <Icon name="cartAdd" />
          </button>
        </form>
      )}
      <p
        role="status"
        className={state.status === "error" ? styles.cartError : "visually-hidden"}
      >
        {state.message}
      </p>
    </div>
  );
}
