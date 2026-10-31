import type { Metadata } from "next";
import { Suspense } from "react";
import { serializeJsonLd, storeJsonLd } from "@/features/catalog/structured-data";
import styles from "@/features/home/home.module.css";
import { HomeInstagramShots } from "@/features/social-proof/components/home-instagram-shots";
import { HomeReviews } from "@/features/social-proof/components/home-reviews";
import { HomeSocialStats } from "@/features/social-proof/components/home-social-stats";
import { SocialProofPart } from "@/features/social-proof/components/social-proof-part";
import { HomeWelcomeOffer } from "@/features/welcome-offer/components/home-welcome-offer";
import { defaultLocale } from "@/lib/i18n";
import { openGraph } from "@/lib/metadata";

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
  alternates: { canonical: "/" },
  description:
    "Речі для прогулянок, подорожей і затишних днів удома. Знайдіть свою добірку в Curly Joy — магазині для собак та їхніх людей.",
  openGraph: openGraph({
    title: "Curly Joy — для життя разом із собакою",
    description:
      "Речі, історії та маленькі відкриття для собак та їхніх людей.",
    url: "/",
  }),
};

export default function HomePage() {
  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(storeJsonLd()) }}
      />
      <HomeHero />
      <Suspense fallback={<HomeBenefits />}>
        <HomeBenefitsWithTerms />
      </Suspense>
      <HomeSocialStats locale={defaultLocale} />
      <Suspense
        fallback={
          <p className={styles.catalogLoading} role="status">
            Готуємо категорії…
          </p>
        }
      >
        <HomeCategories />
      </Suspense>
      <div id="recommendations" className={styles.recommendationsAnchor}>
        <Suspense
          fallback={<p className={styles.catalogLoading} role="status">Готуємо рекомендовані товари…</p>}
        >
          <HomeRecommendations />
        </Suspense>
      </div>
      <Suspense fallback={null}>
        <HomePromotions />
      </Suspense>
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
