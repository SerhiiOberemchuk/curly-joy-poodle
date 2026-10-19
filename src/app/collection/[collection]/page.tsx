import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CatalogPage } from "@/features/catalog/components/catalog-page";
import { getCollection, getCollectionSlugs } from "@/features/catalog/queries";
import { openGraph } from "@/lib/metadata";

/** Cache Components needs at least one param; no live collection prerenders a 404. */
const EMPTY_COLLECTION_SLUG = "__empty__";

export async function generateStaticParams() {
  const slugs = await getCollectionSlugs();
  return (slugs.length > 0 ? slugs : [EMPTY_COLLECTION_SLUG]).map((collection) => ({
    collection,
  }));
}

/** The CRM text, or one line for a collection the merchant left without it. */
function collectionDescription(collection: { title: string; description: string | null }) {
  return collection.description ?? `Усі товари добірки «${collection.title}» в одному місці.`;
}

export async function generateMetadata({
  params,
}: PageProps<"/collection/[collection]">): Promise<Metadata> {
  const collection = await getCollection((await params).collection);
  if (!collection) notFound();
  const description = collectionDescription(collection);
  return {
    title: collection.title,
    description,
    alternates: { canonical: `/collection/${collection.slug}` },
    openGraph: openGraph({
      title: collection.title,
      description,
      url: `/collection/${collection.slug}`,
    }),
  };
}

// A real 404 for a collection that is not live must be decided before the
// first streamed byte, so this page may block navigation.
export const instant = false;

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
      tagline="Речі, які ми обрали для щасливого життя разом."
      description={collectionDescription(collection)}
      searchParams={searchParams}
      collection={collection.slug}
    />
  );
}
