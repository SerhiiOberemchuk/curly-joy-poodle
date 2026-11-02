import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CatalogPage } from "@/features/catalog/components/catalog-page";
import {
  getCategory,
  getCategorySlugs,
} from "@/features/catalog/queries";
import { openGraph } from "@/lib/metadata";

/** Cache Components needs at least one param; an empty catalog prerenders a 404. */
const EMPTY_CATALOG_SLUG = "__empty__";

export async function generateStaticParams() {
  const slugs = await getCategorySlugs();
  return (slugs.length > 0 ? slugs : [EMPTY_CATALOG_SLUG]).map((category) => ({ category }));
}

/** The CRM text, or one line for a category the merchant left without it. */
function categoryDescription(category: { title: string; description: string | null }) {
  return category.description ?? `Усі товари категорії «${category.title}» в одному місці.`;
}

export async function generateMetadata({
  params,
}: PageProps<"/catalog/[category]">): Promise<Metadata> {
  const category = await getCategory((await params).category);
  if (!category) notFound();

  return {
    title: category.title,
    description: categoryDescription(category),
    // Sorted and filtered views show this same category.
    alternates: { canonical: `/catalog/${category.slug}` },
    openGraph: openGraph({
      title: category.title,
      description: categoryDescription(category),
      url: `/catalog/${category.slug}`,
    }),
  };
}

// A real 404 for an unknown category must be decided before the first
// streamed byte, so this page may block navigation. Everything above the list
// then comes from the cached category and is part of the prerendered page.
export const instant = false;

export default async function Page({
  params,
  searchParams,
}: PageProps<"/catalog/[category]">) {
  const category = await getCategory((await params).category);
  if (!category) notFound();
  return (
    <CatalogPage
      eyebrow="Категорія"
      title={category.title}
      description={categoryDescription(category)}
      category={category.slug}
      searchParams={searchParams}
    />
  );
}
