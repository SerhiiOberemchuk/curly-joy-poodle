import type { ProductVariant } from "@/features/catalog/types";

/** Null means the CRM does not track stock; no quantity is invented here. */
export function maxQuantityForVariant(variant: Pick<ProductVariant, "stock" | "inStock">): number | null {
  return variant.inStock ? variant.stock : 0;
}
