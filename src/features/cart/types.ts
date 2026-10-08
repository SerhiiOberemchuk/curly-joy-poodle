import type { ProductImage } from "@/features/catalog/types";

/** The shape persisted in the cart cookie — kept short on purpose. */
export interface StoredCartLine {
  /** CRM product id of the chosen variant. */
  p: string;
  /** Quantity. */
  q: number;
}

/** A cart line resolved against the catalog, ready to render. */
export interface CartLine {
  /** CRM product id of the variant — also the line's stable key. */
  variantId: string;
  slug: string;
  title: string;
  /** Size, colour… of the chosen variant, when the product has one. */
  option: string | null;
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
