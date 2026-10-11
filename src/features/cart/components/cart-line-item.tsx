import Link from "next/link";

import { Price } from "@/components/ui/price";
import { ProductArtwork } from "@/features/catalog/components/product-artwork";

import type { CartLine } from "../types";
import { CartLineControls } from "./cart-line-controls";
import styles from "./cart-view.module.css";

export function CartLineItem({ line }: { line: CartLine }) {
  return (
    <article className={styles.line}>
      <ProductArtwork image={line.image} size="sm" decorative />

      <div className={styles.lineBody}>
        <div className={styles.lineTop}>
          <div>
            <h2 className={styles.lineTitle}>
              <Link href={`/product/${line.slug}`}>{line.title}</Link>
            </h2>
            <p className={styles.lineMeta}>
              {line.option ? `${line.option} · ` : ""}{line.sku}
            </p>
          </div>
          <Price amount={line.lineTotal} size="sm" />
        </div>

        {line.maxQuantity !== null ? (
          <p className={styles.lineMeta}>У наявності: {line.maxQuantity} шт.</p>
        ) : null}

        <CartLineControls line={line} />
      </div>
    </article>
  );
}
