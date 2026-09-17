import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CatalogPage } from "@/features/catalog/components/catalog-page";
import {
  getCategory,
  getCategorySlugs,
} from "@/features/catalog/queries";

export async function generateStaticParams() {
  return (await getCategorySlugs()).map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: PageProps<"/catalog/[category]">): Promise<Metadata> {
  const category = await getCategory((await params).category);
  if (!category) return {};

  return { title: category.title, description: category.description };
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
      tagline={category.tagline}
      description={category.description}
      activeCategory={category.slug}
      accent={category.accent}
      searchParams={searchParams}
    />
  );
}
