import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CollectionPage } from "@/features/catalog/components/collection-page";
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
    <CollectionPage
      collection={collection}
      searchParams={searchParams}
    />
  );
}
