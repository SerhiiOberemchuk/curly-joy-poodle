import "server-only";

import { findVariant } from "@/features/catalog/queries";
import { sumMoney } from "@/lib/money";

import { readCartCookie } from "./cart-cookie";
import { FREE_SHIPPING_THRESHOLD, lineKey } from "./constants";
import type { Cart, CartLine, StoredCartLine } from "./types";

const EMPTY_CART: Cart = {
  lines: [],
  itemCount: 0,
  subtotal: 0,
  savings: 0,
  freeShipping: false,
  freeShippingRemainder: FREE_SHIPPING_THRESHOLD,
  isEmpty: true,
};

/**
 * Resolves stored lines against the live catalog. Lines whose product or size
 * no longer exists are dropped, and quantities are clamped to what is in stock,
 * so a stale cookie can never produce an unfulfillable order.
 */
export async function buildCart(stored: readonly StoredCartLine[]): Promise<Cart> {
  const resolved = await Promise.all(
    stored.map(async (item): Promise<CartLine | null> => {
      const match = await findVariant(item.p, item.s);
      if (!match || match.variant.stock === 0) return null;

      const { product, variant } = match;
      const quantity = Math.min(item.q, variant.stock);

      return {
        key: lineKey(product.id, variant.size),
        productId: product.id,
        slug: product.slug,
        title: product.title,
        line: product.line,
        size: variant.size,
        sku: variant.sku,
        image: product.images[0],
        quantity,
        unitPrice: variant.price,
        compareAtPrice: variant.compareAtPrice,
        lineTotal: variant.price * quantity,
        maxQuantity: variant.stock,
      };
    }),
  );

  const lines = resolved.filter((line): line is CartLine => line !== null);
  if (lines.length === 0) return EMPTY_CART;

  const subtotal = sumMoney(lines.map((line) => line.lineTotal));
  const savings = sumMoney(
    lines.map((line) =>
      line.compareAtPrice ? (line.compareAtPrice - line.unitPrice) * line.quantity : 0,
    ),
  );

  return {
    lines,
    itemCount: lines.reduce((count, line) => count + line.quantity, 0),
    subtotal,
    savings,
    freeShipping: subtotal >= FREE_SHIPPING_THRESHOLD,
    freeShippingRemainder: Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0),
    isEmpty: false,
  };
}

/** Reads the current visitor's cart. Dynamic — render it behind `<Suspense>`. */
export async function getCart(): Promise<Cart> {
  return buildCart(await readCartCookie());
}
