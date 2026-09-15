import type { Metadata } from "next";
import { Suspense } from "react";

import { Section } from "@/components/ui/section";
import { CategoryChips } from "@/features/catalog/components/category-chips";
import { ProductGridSkeleton } from "@/features/catalog/components/product-grid-skeleton";
import { SortedProductList } from "@/features/catalog/components/sorted-product-list";

export const metadata: Metadata = {
  title: "Каталог",
  description:
    "Повний каталог GF Pet: охолоджувальні жилети та бандани, зимові парки, дощовики, рятувальні жилети й аксесуари для собак.",
};

export default function CatalogPage({ searchParams }: PageProps<"/catalog">) {
  return (
    <Section
      eyebrow="Каталог"
      title="Усі товари"
      description="Функціональний одяг та аксесуари GF Pet — від охолоджувальних жилетів до зимових комбінезонів. Розміри від XXS до XXL."
    >
      <CategoryChips />
      <Suspense fallback={<ProductGridSkeleton />}>
        <SortedProductList searchParams={searchParams} />
      </Suspense>
    </Section>
  );
}
