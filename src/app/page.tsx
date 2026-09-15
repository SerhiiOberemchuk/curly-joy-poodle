import { BrandValues } from "@/features/home/components/brand-values";
import { CollectionShowcase } from "@/features/home/components/collection-showcase";
import { Community } from "@/features/home/components/community";
import { Hero } from "@/features/home/components/hero";
import { SizeTeaser } from "@/features/home/components/size-teaser";
import { SummerEdit } from "@/features/home/components/summer-edit";
import { Team } from "@/features/home/components/team";
import { ValueProps } from "@/features/home/components/value-props";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CollectionShowcase />
      <SummerEdit />
      <SizeTeaser />
      <Team />
      <BrandValues />
      <Community />
      <ValueProps />
    </>
  );
}
