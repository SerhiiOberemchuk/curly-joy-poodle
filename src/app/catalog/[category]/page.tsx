import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

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
  if (!category) notFound();

  return { title: category.title, description: category.description ?? undefined };
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

  return category.description ?? `Усі товари категорії «${category.title}» в одному місці.`;
}

export default function Page({
  params,
  searchParams,
}: PageProps<"/catalog/[category]">) {
  return (
    <CatalogPage
      eyebrow="Категорія"
      title={
        <Suspense fallback={"\u00a0"}>
          <CategoryTitle params={params} />
        </Suspense>
      }
      tagline={DEFAULT_TAGLINE}
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
