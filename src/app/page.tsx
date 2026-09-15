import type { Metadata } from "next";

import { BrandStory } from "@/features/home/components/brand-story";
import { LifestyleCollections } from "@/features/home/components/lifestyle-collections";
import { LifestyleHero } from "@/features/home/components/lifestyle-hero";
import { Recommendations } from "@/features/home/components/recommendations";
import { SocialJournal } from "@/features/home/components/social-journal";

export const metadata: Metadata = {
  title: { absolute: "Curly Joy — для життя разом із собакою" },
  description:
    "Речі для прогулянок, подорожей і затишних днів удома. Знайдіть свою добірку в Curly Joy — магазині для собак та їхніх людей.",
  openGraph: {
    title: "Curly Joy — для життя разом із собакою",
    description:
      "Речі, історії та маленькі відкриття для собак та їхніх людей.",
    images: [
      {
        url: "/images/reference/8c922cf1-57f1-44c3-812b-073416497db8.webp",
        width: 1440,
        height: 600,
      },
    ],
  },
};

export default function HomePage() {
  return (
    <>
      <LifestyleHero />
      <LifestyleCollections />
      <Recommendations />
      <BrandStory />
      <SocialJournal />
    </>
  );
}
