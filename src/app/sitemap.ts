import type { MetadataRoute } from "next";

import { infoPages } from "@/content/info-pages";
import { getCategories, getCollectionSlugs, getProductSlugs } from "@/features/catalog/queries";
import { site } from "@/lib/site";

/** Indexable pages: the catalog as the CRM publishes it, plus the info pages. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, collectionSlugs, productSlugs] = await Promise.all([
    getCategories(),
    getCollectionSlugs(),
    getProductSlugs(),
  ]);
  const url = (path: string) => new URL(path, site.url).href;
  return [
    { url: url("/"), changeFrequency: "daily", priority: 1 },
    { url: url("/catalog"), changeFrequency: "daily", priority: 0.9 },
    ...categories.map((category) => ({
      url: url(`/catalog/${category.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...collectionSlugs.map((slug) => ({
      url: url(`/collection/${slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...productSlugs.map((slug) => ({
      url: url(`/product/${slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...infoPages
      .filter((page) => !("draft" in page && page.draft))
      .map((page) => ({
        url: url(`/info/${page.slug}`),
        changeFrequency: "monthly" as const,
        priority: 0.4,
      })),
    { url: url("/business"), changeFrequency: "monthly", priority: 0.4 },
  ];
}
