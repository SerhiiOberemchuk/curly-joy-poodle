import type { Metadata } from "next";

import { CatalogPage } from "@/features/catalog/components/catalog-page";
import { openGraph } from "@/lib/metadata";

export const metadata: Metadata = {
  title: "Каталог товарів для собак",
  description:
    "Одяг, амуніція, аксесуари та речі для щасливого життя разом із собакою.",
  // Sorting, collection and search views show this same catalog.
  alternates: { canonical: "/catalog" },
  openGraph: openGraph({
    title: "Каталог товарів для собак",
    description:
      "Одяг, амуніція, аксесуари та речі для щасливого життя разом із собакою.",
    url: "/catalog",
  }),
};

export default function Page({ searchParams }: PageProps<"/catalog">) {
  return (
    <CatalogPage
      eyebrow="Curly Joy"
      title="Каталог"
      description="Одяг, амуніція та аксесуари для прогулянок і затишних днів удома."
      searchParams={searchParams}
    />
  );
}
