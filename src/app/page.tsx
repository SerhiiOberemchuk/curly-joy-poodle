import type { Metadata } from "next";
import styles from "@/features/home/reference.module.css";

import {
  ReferenceBenefits,
  ReferenceHero,
  ReferenceMoments,
  ReferencePromotions,
  ReferenceRecommendations,
} from "@/features/home/components/reference-home";

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
      <ReferenceHero />
      <ReferenceBenefits />
      <ReferenceMoments />
      <ReferenceRecommendations />
      <ReferencePromotions />
    </div>
  );
}
