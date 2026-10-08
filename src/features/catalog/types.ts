export interface ProductImage {
  /** Product photo from the CRM; `null` until the merchant uploads one. */
  src: string | null;
  alt: string;
}

/**
 * One purchasable item. In the CRM every variant is a product of its own with
 * its own SKU, price and stock; products that share a `productGroupId` are the
 * sizes or colours of one model and are shown here as a single product.
 */
export interface ProductVariant {
  /** CRM product id — what the cart stores. */
  id: string;
  sku: string;
  /** What tells this variant apart from its siblings (size, colour…); `null` for a single variant. */
  label: string | null;
  /** Price in minor units (kopiyky). */
  price: number;
  /** Strike-through price in minor units, when the variant is discounted. */
  compareAtPrice?: number;
  /** Units on hand, or `null` when the CRM does not track this item's stock. */
  stock: number | null;
  inStock: boolean;
}

export interface ProductAttribute {
  name: string;
  value: string;
}

export interface Product {
  id: string;
  slug: string;
  /**
   * The rename-proof tail of the slug (from the SKU or model code). An old link
   * that still ends in it resolves to the product and is redirected.
   */
  urlKey: string;
  title: string;
  brand: string | null;
  categoryId: string | null;
  /** Short plain-text teaser for cards and meta descriptions. */
  summary: string;
  /** Full description as sanitized HTML (p/br/ul/ol/li/strong only). */
  descriptionHtml: string;
  attributes: readonly ProductAttribute[];
  images: readonly ProductImage[];
  /** What the variant labels name, e.g. «Розмір». */
  optionName: string;
  variants: readonly ProductVariant[];
}

export interface Category {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
}

/** A merchandising selection curated in the CRM, independent of categories. */
export interface CollectionInfo {
  slug: string;
  title: string;
  description: string | null;
}

export interface ProductListItem {
  id: string;
  slug: string;
  title: string;
  brand: string | null;
  summary: string;
  image: ProductImage;
  /** Lowest variant price, in minor units. */
  priceFrom: number;
  compareAtPrice?: number;
  /** Variant labels; empty for a single-variant product. */
  options: readonly string[];
  inStock: boolean;
}
