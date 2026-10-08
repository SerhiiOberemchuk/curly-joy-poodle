import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CatalogPage } from "@/features/catalog/components/catalog-page";
import {
  getCategory,
  getCategorySlugs,
} from "@/features/catalog/queries";

/** Cache Components needs at least one param; an empty catalog prerenders a 404. */
const EMPTY_CATALOG_SLUG = "__empty__";

export async function generateStaticParams() {
  const slugs = await getCategorySlugs();
  return (slugs.length > 0 ? slugs : [EMPTY_CATALOG_SLUG]).map((category) => ({ category }));
}

const DEFAULT_TAGLINE = "Речі, які ми обрали для щасливого життя разом.";

export async function generateMetadata({
  params,
}: PageProps<"/catalog/[category]">): Promise<Metadata> {
  const category = await getCategory((await params).category);
  if (!category) return {};

  return { title: category.title, description: category.description ?? undefined };
}

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
      tagline={DEFAULT_TAGLINE}
      description={category.description ?? `Усі товари категорії «${category.title}» в одному місці.`}
      activeCategory={category.slug}
      searchParams={searchParams}
    />
  );
}
