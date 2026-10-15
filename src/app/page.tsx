import type { Metadata } from "next";
import { Suspense } from "react";
import styles from "@/features/home/home.module.css";
import { HomeReviews } from "@/features/reviews/components/home-reviews";
import { HomeWelcomeOffer } from "@/features/welcome-offer/components/home-welcome-offer";

import {
  HomeBenefits,
  HomeHero,
  HomeCategories,
  HomePromotions,
  HomeRecommendations,
} from "@/features/home/components/home-sections";

export const metadata: Metadata = {
  title: { absolute: "Curly Joy — усе для щасливого життя із собакою" },
  description:
    "Речі для прогулянок, подорожей і затишних днів удома. Знайдіть свою добірку в Curly Joy — магазині для собак та їхніх людей.",
  openGraph: {
    title: "Curly Joy — для життя разом із собакою",
    description:
      "Речі, історії та маленькі відкриття для собак та їхніх людей.",
    images: [
      {
        url: "/images/home/hero.webp",
        width: 2167,
        height: 725,
      },
    ],
  },
};

export default function HomePage() {
  return (
    <div className={styles.page}>
      <HomeHero />
      <HomeBenefits />
      <HomeCategories />
      <HomeRecommendations />
      <HomePromotions />
      <Suspense fallback={null}><HomeReviews /></Suspense>
      <HomeWelcomeOffer />
    </div>
  );
}
