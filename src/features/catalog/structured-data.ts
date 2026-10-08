import { CURRENCY } from "@/lib/money";
import { site } from "@/lib/site";

import type { Category, Product } from "./types";

/**
 * schema.org data for a product page, so search engines can show the price,
 * availability and breadcrumbs in results. Rendered as JSON-LD.
 */

function absolute(path: string): string {
  return new URL(path, site.url).toString();
}

export function productJsonLd(product: Product, category: Category | null) {
  const url = absolute(`/product/${product.slug}`);
  const offers = product.variants.map((variant) => ({
    "@type": "Offer",
    sku: variant.sku,
    price: (variant.price / 100).toFixed(2),
    priceCurrency: CURRENCY,
    availability: variant.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    itemCondition: "https://schema.org/NewCondition",
    url,
  }));

  const breadcrumbs = [
    { name: "Головна", path: "/" },
    { name: "Каталог", path: "/catalog" },
    ...(category ? [{ name: category.title, path: `/catalog/${category.slug}` }] : []),
    { name: product.title, path: `/product/${product.slug}` },
  ];

  return [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.title,
      ...(product.summary ? { description: product.summary } : {}),
      image: product.images.flatMap((image) => (image.src ? [image.src] : [])),
      ...(product.variants.length === 1 ? { sku: product.variants[0].sku } : {}),
      ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
      ...(category ? { category: category.title } : {}),
      offers: offers.length === 1 ? offers[0] : offers,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        item: absolute(crumb.path),
      })),
    },
  ];
}

/** `<` is escaped so a product name can never close the script element. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
