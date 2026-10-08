import "server-only";

import { CURRENCY } from "@/lib/money";

import {
  fetchCategories,
  fetchProducts,
  type CrmCategory,
  type CrmProduct,
} from "./crm-api";
import type { Category, Product, ProductImage, ProductVariant } from "./types";

/**
 * Builds the storefront catalog from the client's obriym-crm account. The CRM
 * is the only source of products and categories: nothing is seeded here, so
 * what the merchant publishes in the CRM is exactly what the shop shows.
 */

export interface Catalog {
  /** Newest first, the order the CRM returns them in. */
  products: readonly Product[];
  /** Only categories that hold at least one product, directly or below. */
  categories: readonly Category[];
}

export async function loadCatalog(): Promise<Catalog> {
  const [crmProducts, crmCategories] = await Promise.all([fetchProducts(), fetchCategories()]);
  const products = buildProducts(crmProducts);
  return { products, categories: buildCategories(crmCategories, products) };
}

// ---------------------------------------------------------------------------
// Products

const SIZE_ORDER = ["XXXS", "XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];

function buildProducts(crmProducts: readonly CrmProduct[]): Product[] {
  // Products sharing a `productGroupId` are the sizes or colours of one model.
  const groups = new Map<string, CrmProduct[]>();
  for (const item of crmProducts) {
    const key = item.productGroupId?.trim() ? `group:${item.productGroupId.trim()}` : item.id;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  const usedSlugs = new Set<string>();
  const products: Product[] = [];

  for (const [id, members] of groups) {
    const product = buildProduct(id, members, usedSlugs);
    if (product) products.push(product);
  }

  return products;
}

function buildProduct(
  id: string,
  members: readonly CrmProduct[],
  usedSlugs: Set<string>,
): Product | null {
  const grouped = id.startsWith("group:");
  const optionName = optionNameFor(members);
  const variants = orderVariants(
    members.flatMap((item): ProductVariant[] => {
      const price = priceOf(item);
      return price ? [{ ...price, ...stockOf(item), id: item.id, sku: item.sku ?? item.id, label: labelOf(item, grouped) }] : [];
    }),
  );
  // A product without a price in the shop's currency cannot be sold here.
  if (variants.length === 0) return null;

  const lead = members[0];
  const title = grouped ? modelTitle(members) : lead.name.trim();
  const descriptionSource = members.find((item) => item.description?.trim()) ?? lead;
  const description = descriptionSource.description?.trim() ?? "";

  let urlKey = slugify(grouped ? id.slice("group:".length) : (lead.sku ?? "")) || lead.id.slice(0, 12);
  let slug = joinSlug(slugify(title), urlKey);
  if (usedSlugs.has(slug)) {
    urlKey = `${urlKey}-${lead.id.slice(0, 6)}`;
    slug = joinSlug(slugify(title), urlKey);
  }
  usedSlugs.add(slug);

  return {
    id,
    slug,
    urlKey,
    title,
    brand: lead.brand?.name?.trim() || null,
    categoryId: lead.category?.id ?? null,
    summary: summarize(description),
    descriptionHtml: sanitizeDescriptionHtml(descriptionSource.descriptionHtml ?? ""),
    attributes: (descriptionSource.attributes ?? []).map((attribute) => ({
      name: attribute.name,
      value: attribute.unit ? `${attribute.value} ${attribute.unit}` : attribute.value,
    })),
    images: imagesOf(members, title),
    optionName,
    variants,
  };
}

function priceOf(item: CrmProduct): Pick<ProductVariant, "price" | "compareAtPrice"> | null {
  const entry =
    item.currency === CURRENCY
      ? { price: item.price, compareAtPrice: item.compareAtPrice }
      : item.prices?.find((candidate) => candidate.currency === CURRENCY);
  if (!entry || !(entry.price > 0)) return null;

  // The CRM works in hryvnia, the shop in kopiyky.
  const price = Math.round(entry.price * 100);
  const compareAtPrice = entry.compareAtPrice ? Math.round(entry.compareAtPrice * 100) : 0;
  return { price, compareAtPrice: compareAtPrice > price ? compareAtPrice : undefined };
}

function stockOf(item: CrmProduct): Pick<ProductVariant, "stock" | "inStock"> {
  const stock = typeof item.stock === "number" ? Math.max(0, item.stock) : null;
  return {
    stock,
    inStock: item.availability !== "out_of_stock" && (stock === null || stock > 0),
  };
}

function labelOf(item: CrmProduct, grouped: boolean): string | null {
  const parts = [item.color?.trim(), item.size?.trim()].filter(Boolean);
  if (parts.length > 0) return parts.join(" · ");
  return grouped ? item.name.trim() : null;
}

function optionNameFor(members: readonly CrmProduct[]): string {
  const sized = members.some((item) => item.size?.trim());
  const coloured = members.some((item) => item.color?.trim());
  if (sized && !coloured) return "Розмір";
  if (coloured && !sized) return "Колір";
  return "Варіант";
}

function orderVariants(variants: ProductVariant[]): ProductVariant[] {
  const rank = (variant: ProductVariant) => SIZE_ORDER.indexOf(variant.label?.toUpperCase() ?? "");
  if (!variants.every((variant) => rank(variant) >= 0)) return variants;
  return variants.sort((a, b) => rank(a) - rank(b));
}

/** The words every variant name starts with — «Шлейка Classic» for «Шлейка Classic S/M/L». */
function modelTitle(members: readonly CrmProduct[]): string {
  const names = members.map((item) => item.name.trim().split(/\s+/));
  const shared: string[] = [];
  for (const [index, word] of names[0].entries()) {
    if (!names.every((words) => words[index] === word)) break;
    shared.push(word);
  }
  const title = shared.join(" ").replace(/[\s,;:/(–—-]+$/, "");
  return title || members[0].name.trim();
}

function imagesOf(members: readonly CrmProduct[], title: string): ProductImage[] {
  const seen = new Set<string>();
  const images: ProductImage[] = [];
  for (const item of members) {
    for (const image of item.images ?? []) {
      if (!image.url || seen.has(image.url)) continue;
      seen.add(image.url);
      images.push({ src: image.url, alt: image.alt?.trim() || title });
    }
  }
  return images.length > 0 ? images : [{ src: null, alt: title }];
}

// ---------------------------------------------------------------------------
// Categories

function buildCategories(
  crmCategories: readonly CrmCategory[],
  products: readonly Product[],
): Category[] {
  const parentOf = new Map(crmCategories.map((category) => [category.id, category.parentId]));
  const stocked = new Set<string>();
  for (const product of products) {
    // A product makes its own category and every ancestor non-empty.
    let current = product.categoryId;
    while (current && !stocked.has(current)) {
      stocked.add(current);
      current = parentOf.get(current) ?? null;
    }
  }

  const usedSlugs = new Set<string>();
  return crmCategories
    .filter((category) => stocked.has(category.id))
    .map((category) => {
      let slug = slugify(category.slug ?? "") || slugify(category.name) || category.id;
      if (usedSlugs.has(slug)) slug = `${slug}-${category.id.slice(0, 6)}`;
      usedSlugs.add(slug);

      return {
        id: category.id,
        slug,
        title: category.name.trim(),
        description: category.description?.trim() || null,
        imageUrl: category.imageUrl,
        parentId: category.parentId,
      };
    });
}

// ---------------------------------------------------------------------------
// Text

/** Mirrors obriym-crm's catalog slug rule, so a name yields the same segment in both. */
const TRANSLITERATION: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh",
  з: "z", и: "y", і: "i", ї: "i", й: "i", к: "k", л: "l", м: "m", н: "n",
  о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "iu", я: "ia", ы: "y", э: "e",
  ъ: "", ё: "e",
};

export function slugify(value: string, maxLength = 80): string {
  return value
    .trim()
    .toLowerCase()
    .split("")
    .map((char) => TRANSLITERATION[char] ?? char)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
}

function joinSlug(name: string, urlKey: string): string {
  return name ? `${name}-${urlKey}` : urlKey;
}

/** First sentence of the description without the CRM's light markup, for cards and meta tags. */
function summarize(description: string, maxLength = 160): string {
  const text = description
    .replace(/\*\*/g, "")
    .replace(/^\s*(?:[-•]|\d+\.)\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  const sentence = text.match(/^.+?[.!?…](?=\s|$)/)?.[0] ?? text;
  if (sentence.length <= maxLength) return sentence;

  const cut = sentence.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:–—-]+$/, "")}…`;
}

const ALLOWED_TAGS = new Set(["p", "br", "ul", "ol", "li", "strong"]);

/**
 * The CRM renders descriptions to HTML with only these tags and no attributes.
 * The page injects it as HTML, so that promise is enforced here as well: any
 * other tag is dropped, attributes are stripped, and every `<` or `>` that is
 * not part of an allowed tag is escaped.
 */
function sanitizeDescriptionHtml(html: string): string {
  return html.replace(
    /<(\/?)([a-z][a-z0-9]*)\b[^<>]*>|[<>]/gi,
    (match, slash: string | undefined, tag: string | undefined) => {
      if (!tag) return match === "<" ? "&lt;" : "&gt;";
      const name = tag.toLowerCase();
      return ALLOWED_TAGS.has(name) ? `<${slash}${name}>` : "";
    },
  );
}
