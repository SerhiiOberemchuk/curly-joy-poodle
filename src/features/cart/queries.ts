import "server-only";

import {
  getCurrentProducts,
  getListedProducts,
} from "@/features/catalog/queries";
import type { Product } from "@/features/catalog/types";
import { getCapabilities } from "@/features/checkout/crm";
import type { CrmCapabilities } from "@/features/checkout/crm/types";
import { hryvniaCartTerms } from "@/features/checkout/options";
import { calculateCart } from "./calculate";
import { readCartCookie } from "./cart-cookie";
import { maxQuantityForVariant } from "./quantity";
import type { Cart, CartLine, StoredCartLine } from "./types";

const EMPTY_CART: Cart = {
  lines: [],
  itemCount: 0,
  subtotal: 0,
  savings: 0,
  freeShipping: false,
  freeShippingThreshold: null,
  freeShippingRemainder: null,
  minOrderAmount: null,
  minOrderRemainder: null,
  isEmpty: true,
};

/**
 * Lines whose variant no longer exists or is sold out are dropped, and
 * quantities are clamped to what is in stock.
 */
function resolveLines(
  stored: readonly StoredCartLine[],
  products: readonly Product[],
): CartLine[] {
  const variants = new Map(
    products.flatMap((product) =>
      product.variants.map(
        (variant) => [variant.id, { product, variant }] as const,
      ),
    ),
  );
  return stored.flatMap((item): CartLine[] => {
    const match = variants.get(item.p);
    if (!match || !match.variant.inStock) return [];

    const { product, variant } = match;
    const maxQuantity = maxQuantityForVariant(variant);
    const quantity =
      maxQuantity === null ? item.q : Math.min(item.q, maxQuantity);

    return [
      {
        variantId: variant.id,
        slug: product.slug,
        title: product.title,
        option: variant.label,
        sku: variant.sku,
        image: product.images[0],
        quantity,
        unitPrice: variant.price,
        compareAtPrice: variant.compareAtPrice,
        lineTotal: variant.price * quantity,
        maxQuantity,
      },
    ];
  });
}

function priceCart(
  stored: readonly StoredCartLine[],
  products: readonly Product[],
  capabilities: CrmCapabilities,
): Cart {
  const lines = resolveLines(stored, products);
  if (lines.length === 0) return EMPTY_CART;
  return calculateCart(lines, hryvniaCartTerms(capabilities));
}

/**
 * Prices stored lines against the live catalog and the CRM's current cart
 * terms, read together and returned together, so a caller that needs the terms
 * as well (checkout) does not ask the CRM twice. Checkout also compares the
 * result with the requested quantities before saving an order; this read does
 * not reserve inventory in the CRM.
 */
export async function loadCart(
  stored: readonly StoredCartLine[],
): Promise<{ cart: Cart; capabilities: CrmCapabilities }> {
  const [products, capabilities] = await Promise.all([
    getCurrentProducts(),
    getCapabilities(),
  ]);
  return { cart: priceCart(stored, products, capabilities), capabilities };
}

/** Whether the stored cookie already holds this priced cart, line for line. */
export function matchesStored(
  stored: readonly StoredCartLine[],
  cart: Cart,
): boolean {
  return (
    stored.length === cart.lines.length &&
    stored.every((item) =>
      cart.lines.some(
        (line) => line.variantId === item.p && line.quantity === item.q,
      ),
    )
  );
}

/** Reads the current visitor's cart. Dynamic — render it behind `<Suspense>`. */
export async function getCart(): Promise<Cart> {
  const stored = await readCartCookie();
  return stored.length === 0 ? EMPTY_CART : (await loadCart(stored)).cart;
}

/**
 * The header badge, on every page: resolved against the cached catalog, so a
 * page view costs the CRM nothing, and still shown when the CRM cannot be
 * reached — then as the units the buyer saved. The cart page and checkout
 * re-check against fresh stock.
 */
export async function getCartItemCount(): Promise<number> {
  const stored = await readCartCookie();
  if (stored.length === 0) return 0;
  try {
    const lines = resolveLines(stored, await getListedProducts());
    return lines.reduce((count, line) => count + line.quantity, 0);
  } catch {
    return stored.reduce((count, line) => count + line.q, 0);
  }
}
