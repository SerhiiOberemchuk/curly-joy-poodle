/**
 * Languages the storefront renders. Ukrainian is the only one today; a new
 * language is added here together with its entries in the feature dictionaries.
 */
export const locales = ["uk"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "uk";

export function hasLocale(value: string): value is Locale {
  return locales.some((locale) => locale === value);
}
