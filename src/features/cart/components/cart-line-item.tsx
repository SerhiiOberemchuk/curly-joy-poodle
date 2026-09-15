import Link from "next/link";

import { Price } from "@/components/ui/price";
import { ProductArtwork } from "@/features/catalog/components/product-artwork";

import { removeLineAction, setLineQuantityAction } from "../actions";
import { MAX_LINE_QUANTITY } from "../constants";
import type { CartLine } from "../types";
import styles from "./cart-view.module.css";

/**
 * Plain forms rather than a client component: quantity changes keep working
 * without JavaScript, and the server stays the only source of truth for stock.
 */
export function CartLineItem({ line }: { line: CartLine }) {
  const ceiling = Math.min(line.maxQuantity, MAX_LINE_QUANTITY);

  return (
    <article className={styles.line}>
      <ProductArtwork image={line.image} size="sm" />

      <div className={styles.lineBody}>
        <div className={styles.lineTop}>
          <div>
            <h3 className={styles.lineTitle}>
              <Link href={`/product/${line.slug}`}>{line.title}</Link>
            </h3>
            <p className={styles.lineMeta}>
              Розмір {line.size} · {line.sku}
            </p>
          </div>
          <Price amount={line.lineTotal} size="sm" />
        </div>

        <div className={styles.lineControls}>
          <div className={styles.stepper}>
            <QuantityButton
              line={line}
              quantity={line.quantity - 1}
              label="Зменшити кількість"
              symbol="−"
              disabled={line.quantity <= 1}
            />
            <span className={styles.stepperValue}>{line.quantity}</span>
            <QuantityButton
              line={line}
              quantity={line.quantity + 1}
              label="Збільшити кількість"
              symbol="+"
              disabled={line.quantity >= ceiling}
            />
          </div>

          <form action={removeLineAction}>
            <input type="hidden" name="productId" value={line.productId} />
            <input type="hidden" name="size" value={line.size} />
            <button type="submit" className={styles.remove}>
              Видалити
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}

function QuantityButton({
  line,
  quantity,
  label,
  symbol,
  disabled,
}: {
  line: CartLine;
  quantity: number;
  label: string;
  symbol: string;
  disabled: boolean;
}) {
  return (
    <form action={setLineQuantityAction}>
      <input type="hidden" name="productId" value={line.productId} />
      <input type="hidden" name="size" value={line.size} />
      <input type="hidden" name="quantity" value={quantity} />
      <button type="submit" className={styles.stepperButton} aria-label={label} disabled={disabled}>
        {symbol}
      </button>
    </form>
  );
}
