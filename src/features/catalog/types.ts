export type SeasonalCollection = "summer" | "winter" | "all-season";

export type Collection =
  | SeasonalCollection
  | "walks"
  | "travel"
  | "at-home"
  | "dress-up"
  | "curly-joy-recommends";

export type SizeCode = "XXS" | "XS" | "S" | "M" | "L" | "XL" | "XXL";

export interface SizeGuideRow {
  /** Size label shown to the customer. */
  code: SizeCode;
  /** Back length (withers to tail base), cm. */
  backLengthCm: [number, number];
  /** Chest girth, cm. */
  chestCm: [number, number];
  /** Typical breeds for this size — the fastest way for a customer to self-select. */
  breeds: string;
}

export interface ProductVariant {
  sku: string;
  size: SizeCode;
  /** Price in minor units (kopiyky). */
  price: number;
  /** Strike-through price in minor units, when the variant is discounted. */
  compareAtPrice?: number;
  stock: number;
}

export interface ProductImage {
  /** Local product photography, when available. */
  src?: string;
  /** Two-stop gradient used by the placeholder artwork until real photos land. */
  from: string;
  to: string;
  /** Emoji stand-in for the product silhouette. */
  glyph: string;
  alt: string;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  /** Trademarked product line, e.g. `ICE-VEST®`. */
  line?: string;
  brand: string;
  categorySlug: string;
  collection: SeasonalCollection;
  summary: string;
  description: string;
  features: readonly string[];
  care: readonly string[];
  badges: readonly string[];
  images: readonly ProductImage[];
  variants: readonly ProductVariant[];
}

export type Accent = "accent" | "mint" | "sky";

export interface Category {
  slug: string;
  title: string;
  /** Short line used on category cards and as the listing subtitle. */
  tagline: string;
  description: string;
  accent: Accent;
  glyph: string;
  /** Explicit membership supports lifestyle categories with overlapping products. */
  productSlugs: readonly string[];
}

/** Seasonal or editorial grouping, independent of product categories. */
export interface CollectionInfo {
  slug: Collection;
  title: string;
  tagline: string;
  description: string;
  accent: Accent;
  glyph: string;
  /** Explicit membership lets one product appear in several lifestyle edits. */
  productSlugs?: readonly string[];
}

export interface ProductListItem {
  id: string;
  slug: string;
  title: string;
  line?: string;
  summary: string;
  categorySlug: string;
  badges: readonly string[];
  image: ProductImage;
  /** Lowest variant price, in minor units. */
  priceFrom: number;
  compareAtPrice?: number;
  sizes: readonly SizeCode[];
  inStock: boolean;
}
