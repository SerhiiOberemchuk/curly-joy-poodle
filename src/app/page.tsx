import type { Metadata } from "next";
import { Suspense } from "react";
import styles from "@/features/home/home.module.css";
import { HomeInstagramShots } from "@/features/social-proof/components/home-instagram-shots";
import { HomeReviews } from "@/features/social-proof/components/home-reviews";
import { HomeSocialStats } from "@/features/social-proof/components/home-social-stats";
import { SocialProofPart } from "@/features/social-proof/components/social-proof-part";
import { HomeWelcomeOffer } from "@/features/welcome-offer/components/home-welcome-offer";
import { defaultLocale } from "@/lib/i18n";

import {
  HomeBenefits,
  HomeBenefitsWithTerms,
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
      <Suspense fallback={<HomeBenefits />}>
        <HomeBenefitsWithTerms />
      </Suspense>
      <HomeSocialStats locale={defaultLocale} />
      <HomeCategories />
      <HomeRecommendations />
      <HomePromotions />
      <SocialProofPart>
        <HomeReviews locale={defaultLocale} />
      </SocialProofPart>
      <SocialProofPart>
        <HomeInstagramShots locale={defaultLocale} />
      </SocialProofPart>
      <Suspense fallback={null}>
        <HomeWelcomeOffer locale={defaultLocale} />
      </Suspense>
    </div>
  );
}
