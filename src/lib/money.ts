/**
 * Money is stored everywhere as an integer amount of minor units (kopiyky)
 * to keep arithmetic exact. Formatting happens only at the render boundary.
 */

export const CURRENCY = "UAH" as const;

const formatter = new Intl.NumberFormat("uk-UA", {
  style: "currency",
  currency: CURRENCY,
  currencyDisplay: "narrowSymbol",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatMoney(minorUnits: number): string {
  return formatter.format(Math.round(minorUnits) / 100);
}

export function sumMoney(amounts: readonly number[]): number {
  return amounts.reduce((total, amount) => {
    const next = total + amount;
    if (!Number.isSafeInteger(amount) || !Number.isSafeInteger(next)) {
      throw new RangeError("Money exceeds the safe minor-unit range.");
    }
    return next;
  }, 0);
}

export function discountPercent(price: number, compareAtPrice: number): number {
  if (compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}
