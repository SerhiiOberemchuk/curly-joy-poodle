/**
 * Whole-percent discount against the CRM's strike-through price, or `null`
 * when the item is not discounted. Rounded down, so a badge never promises
 * more than the buyer actually saves.
 */
export function discountPercent(price: number, compareAtPrice?: number): number | null {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  const percent = Math.floor(((compareAtPrice - price) / compareAtPrice) * 100);
  return percent > 0 ? percent : null;
}
