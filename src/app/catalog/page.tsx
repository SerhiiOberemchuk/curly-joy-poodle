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
      eyebrow="Каталог Curly Joy"
      title="Усе для життя разом"
      tagline="Вибираємо речі, якими із задоволенням користувалися б самі — якби мали лапи."
      description="Одяг для будь-якої погоди, речі для прогулянок, подорожей і затишних днів удома. Усі товари зібрані в одному місці, щоб потрібне знаходилося легко."
      searchParams={searchParams}
    />
  );
}
