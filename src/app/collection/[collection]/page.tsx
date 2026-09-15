import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Section } from "@/components/ui/section";
import { ProductGridSkeleton } from "@/features/catalog/components/product-grid-skeleton";
import { SortedProductList } from "@/features/catalog/components/sorted-product-list";
import { getCollection, getCollections } from "@/features/catalog/queries";

export async function generateStaticParams() {
  const collections = await getCollections();
  return collections.map((collection) => ({ collection: collection.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/collection/[collection]">): Promise<Metadata> {
  const { collection: slug } = await params;
  const collection = await getCollection(slug);
  if (!collection) return {};

  return {
    title: collection.title,
    description: collection.description,
  };
}

export default function CollectionPage({
  params,
  searchParams,
}: PageProps<"/collection/[collection]">) {
  return (
    <Suspense
      fallback={
        <Section>
          <ProductGridSkeleton />
        </Section>
      }
    >
      <CollectionListing params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function CollectionListing({
  params,
  searchParams,
}: PageProps<"/collection/[collection]">) {
  const { collection: slug } = await params;
  const collection = await getCollection(slug);
  if (!collection) notFound();

  return (
    <Section
      eyebrow={collection.tagline}
      title={collection.title}
      description={collection.description}
      action={{ href: "/catalog", label: "Весь каталог" }}
    >
      <Suspense fallback={<ProductGridSkeleton />}>
        <SortedProductList searchParams={searchParams} collection={collection.slug} />
      </Suspense>
    </Section>
  );
}
