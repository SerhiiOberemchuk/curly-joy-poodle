import type { ProductImage, SizeCode } from "@/features/catalog/types";

/** The shape persisted in the cart cookie — kept short on purpose. */
export interface StoredCartLine {
  /** Product id. */
  p: string;
  /** Size code. */
  s: SizeCode;
  /** Quantity. */
  q: number;
}

/** A cart line resolved against the catalog, ready to render. */
export interface CartLine {
  /** Stable identifier for a product + size pair. */
  key: string;
  productId: string;
  slug: string;
  title: string;
  line?: string;
  size: SizeCode;
  sku: string;
  image: ProductImage;
  quantity: number;
  /** Price per unit in minor units, always re-read from the catalog. */
  unitPrice: number;
  compareAtPrice?: number;
  lineTotal: number;
  /** Upper bound the quantity stepper must respect. */
  maxQuantity: number;
}

export interface Cart {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  /** Total saved against strike-through prices, in minor units. */
  savings: number;
  freeShipping: boolean;
  /** Minor units still missing for free shipping; `0` once reached. */
  freeShippingRemainder: number;
  isEmpty: boolean;
}
