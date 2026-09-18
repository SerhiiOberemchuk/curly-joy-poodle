import type { CategoryRoute, ProductRoute } from "@/features/catalog/catalog-source";

/** Artwork windows in the client's 1024 × 1536 reference, without UI captions. */
export type ArtworkWindow = readonly [
  x: number,
  y: number,
  width: number,
  height: number,
];

export interface HomeRecommendation {
  id: string;
  brand: string;
  title: string;
  price: string;
  /** Checked against the catalogue: a card cannot point at a product we lack. */
  href: ProductRoute;
  artwork: ArtworkWindow;
}

export const homeMoments = [
  {
    title: "Подорожуємо разом",
    description: "Усе для комфортних і безпечних подорожей",
    href: "/catalog/travel",
    artwork: [21, 631, 240, 137],
  },
  {
    title: "Гуляємо та досліджуємо",
    description: "Амуніція, одяг, безпека",
    href: "/catalog/walks",
    artwork: [271, 632, 236, 137],
  },
  {
    title: "Їмо з задоволенням",
    description: "Корм, смаколики, миски",
    href: "/catalog/feeding",
    artwork: [519, 632, 235, 141],
  },
  {
    title: "Доглядаємо з любов’ю",
    description: "Краса, гігієна, парфуми",
    href: "/catalog/grooming",
    artwork: [767, 632, 236, 141],
  },
  {
    title: "Здоров’я та перша допомога",
    description: "Аптечки, ветеринарія, сезонний захист",
    href: "/catalog/health",
    artwork: [21, 835, 239, 139],
  },
  {
    title: "Тренуємось та граємо",
    description: "Іграшки, тренування, активності",
    href: "/catalog/toys",
    artwork: [272, 836, 235, 139],
  },
  {
    title: "Відпочиваємо вдома",
    description: "Лежанки, пледи, затишок",
    href: "/catalog/at-home",
    artwork: [520, 837, 234, 137],
  },
  {
    title: "Ідеї для подарунків",
    description: "Для собак і для pet parents",
    href: "/catalog/gifts",
    artwork: [768, 837, 235, 135],
  },
] as const satisfies readonly {
  title: string;
  description: string;
  href: CategoryRoute;
  artwork: ArtworkWindow;
}[];

/** Editorial order of the cards; the products themselves live in the catalogue. */
export const homeRecommendations = [
  {
    id: "emmy-lili",
    brand: "Emmy and Lili",
    title: "Парфум для собак",
    price: "1 490 ₴",
    href: "/product/emmy-lili-perfume",
    artwork: [282, 1076, 66, 104],
  },
  {
    id: "harry-barker",
    brand: "Harry Barker",
    title: "Шлейка Classic",
    price: "1 890 ₴",
    href: "/product/harry-barker-classic",
    artwork: [410, 1080, 94, 101],
  },
  {
    id: "liewood",
    brand: "Liewood",
    title: "Миска керамічна",
    price: "1 190 ₴",
    href: "/product/liewood-bowl",
    artwork: [555, 1081, 113, 100],
  },
  {
    id: "jellycat",
    brand: "Jellycat",
    title: "Іграшка Puppy",
    price: "1 250 ₴",
    href: "/product/jellycat-puppy",
    artwork: [711, 1077, 96, 103],
  },
  {
    id: "pawfect",
    brand: "Pawfect",
    title: "Смаколики з лосося",
    price: "350 ₴",
    href: "/product/pawfect-salmon",
    artwork: [869, 1077, 79, 104],
  },
] as const satisfies readonly HomeRecommendation[];
