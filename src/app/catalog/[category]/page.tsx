import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Section } from "@/components/ui/section";
import { CategoryChips } from "@/features/catalog/components/category-chips";
import { ProductGridSkeleton } from "@/features/catalog/components/product-grid-skeleton";
import { SortedProductList } from "@/features/catalog/components/sorted-product-list";
import { getCategory, getCategorySlugs } from "@/features/catalog/queries";

export async function generateStaticParams() {
  const slugs = await getCategorySlugs();
  return slugs.map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: PageProps<"/catalog/[category]">): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await getCategory(slug);
  if (!category) return {};

  return {
    title: category.title,
    description: category.description,
  };
}

export default function CategoryPage({ params, searchParams }: PageProps<"/catalog/[category]">) {
  return (
    <Suspense fallback={<CategorySkeleton />}>
      <CategoryListing params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function CategoryListing({
  params,
  searchParams,
}: PageProps<"/catalog/[category]">) {
  const { category: slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();

  return (
    <Section eyebrow={category.tagline} title={category.title} description={category.description}>
      <CategoryChips activeSlug={category.slug} />
      <Suspense fallback={<ProductGridSkeleton />}>
        <SortedProductList searchParams={searchParams} category={category.slug} />
      </Suspense>
    </Section>
  );
}

function CategorySkeleton() {
  return (
    <Section>
      <ProductGridSkeleton />
    </Section>
  );
}
