import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CatalogPage } from "@/features/catalog/components/catalog-page";
import { getCollection, getCollections } from "@/features/catalog/queries";

export async function generateStaticParams() {
  return (await getCollections()).map(({ slug: collection }) => ({ collection }));
}

export async function generateMetadata({
  params,
}: PageProps<"/collection/[collection]">): Promise<Metadata> {
  const collection = await getCollection((await params).collection);
  if (!collection) return {};

  return { title: collection.title, description: collection.description };
}

export default async function Page({
  params,
  searchParams,
}: PageProps<"/collection/[collection]">) {
  const collection = await getCollection((await params).collection);
  if (!collection) notFound();

  return (
    <CatalogPage
      eyebrow="Добірка Curly Joy"
      title={collection.title}
      tagline={collection.tagline}
      description={collection.description}
      collection={collection.slug}
      accent={collection.accent}
      searchParams={searchParams}
    />
  );
}
