import type { SizeCode } from "@/features/catalog/types";

/** Shared between the server cart and the client widgets, so no `server-only` here. */

export const CART_COOKIE = "cjp_cart";
export const MAX_LINE_QUANTITY = 10;
export const MAX_CART_LINES = 30;

/** Orders above this subtotal (minor units) ship at the store's expense. */
export const FREE_SHIPPING_THRESHOLD = 150000;

export function lineKey(productId: string, size: SizeCode): string {
  return `${productId}:${size}`;
}
