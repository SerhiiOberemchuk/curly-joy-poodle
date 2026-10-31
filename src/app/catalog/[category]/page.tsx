import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

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

type CategoryParams = PageProps<"/catalog/[category]">["params"];

async function CategoryTitle({ params }: { params: CategoryParams }) {
  const category = await getCategory((await params).category);
  if (!category) notFound();

  return category.title;
}

async function CategoryDescription({ params }: { params: CategoryParams }) {
  const category = await getCategory((await params).category);
  if (!category) return null;

  return categoryDescription(category);
}

// A real 404 for an unknown category must be decided before the first
// streamed byte, so this page may block navigation.
export const instant = false;

export default async function Page({
  params,
  searchParams,
}: PageProps<"/catalog/[category]">) {
  if (!(await getCategory((await params).category))) notFound();
  return (
    <CatalogPage
      eyebrow="Категорія"
      title={
        <Suspense fallback={"\u00a0"}>
          <CategoryTitle params={params} />
        </Suspense>
      }
      description={
        <Suspense fallback={"\u00a0"}>
          <CategoryDescription params={params} />
        </Suspense>
      }
      activeCategory={params.then(({ category }) => category)}
      searchParams={searchParams}
    />
  );
}
