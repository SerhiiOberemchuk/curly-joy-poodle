import { sumMoney } from "@/lib/money";

import type { Cart, CartLine } from "./types";

/** Derive totals from the displayed CRM quote and the chosen quantities. */
export function calculateCart(
  sourceLines: readonly CartLine[],
  terms: Pick<Cart, "freeShippingThreshold" | "minOrderAmount">,
): Cart {
  const lines = sourceLines.map((line) => ({
    ...line,
    lineTotal: line.unitPrice * line.quantity,
  }));
  const subtotal = sumMoney(lines.map((line) => line.lineTotal));
  const savings = sumMoney(
    lines.map((line) =>
      line.compareAtPrice
        ? (line.compareAtPrice - line.unitPrice) * line.quantity
        : 0,
    ),
  );
  const { freeShippingThreshold, minOrderAmount } = terms;
  return {
    lines,
    itemCount: lines.reduce((count, line) => count + line.quantity, 0),
    subtotal,
    savings,
    freeShipping:
      freeShippingThreshold !== null && subtotal >= freeShippingThreshold,
    freeShippingThreshold,
    freeShippingRemainder:
      freeShippingThreshold === null
        ? null
        : Math.max(freeShippingThreshold - subtotal, 0),
    minOrderAmount,
    minOrderRemainder:
      minOrderAmount === null ? null : Math.max(minOrderAmount - subtotal, 0),
    isEmpty: lines.length === 0,
  };
}
