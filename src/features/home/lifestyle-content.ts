import type { Collection } from "@/features/catalog/types";

const photo = (name: string) => `/images/reference/${name}.webp`;

/** Editorial content is separate from layout and catalog inventory. */
export const lifestyleImages = {
  hero: photo("6a02d2e960a7a52fdc244cc4"),
  picnic: photo("6a02d2e9fa8afa3be0b0dfbc"),
  story: photo("4ea3d13f-83c7-49cb-ad0f-c1c424a82ab9"),
} as const;

interface LifestyleMoment {
  collection: Collection;
  title: string;
  description: string;
  image: string;
  alt: string;
  framing: "walk" | "travel" | "home" | "dress";
}

export const lifestyleMoments: readonly LifestyleMoment[] = [
  {
    collection: "walks",
    title: "Гуляємо",
    description: "Знайомі стежки. Нові маленькі відкриття.",
    image: photo("6a01deeca2398e6af2ca63ab"),
    alt: "Абрикосовий пудель на прогулянці біля зеленої галявини",
    framing: "walk",
  },
  {
    collection: "travel",
    title: "Подорожуємо разом",
    description: "Найкращий попутник уже зібрався.",
    image: photo("6a02d2e9fa8afa3be0b0dfbc"),
    alt: "Собаки Curly Joy на спільному пікніку в парку",
    framing: "travel",
  },
  {
    collection: "at-home",
    title: "Відпочиваємо вдома",
    description: "Щастя — коли можна просто бути поруч.",
    image: photo("4086b62e-afbf-4862-a22e-8a835308cb96"),
    alt: "Пудель з рожевою банданою відпочиває біля дивана",
    framing: "home",
  },
  {
    collection: "dress-up",
    title: "Одягаємось",
    description: "Для будь-якої погоди. І власного настрою.",
    image: photo("6a02d2e960a7a52fdc244cc4"),
    alt: "Пудель Луна у пудрово-рожевій футболці",
    framing: "dress",
  },
];

export const journalPhotos = [
  {
    image: photo("6a02d2e9355da19d8c21efcb"),
    alt: "Затишний день із пуделем удома",
  },
  {
    image: photo("6a02d2e982125b98745bb454"),
    alt: "Чотирилапа компанія Curly Joy на природі",
  },
  {
    image: photo("6a02d2e982125b98745bb453"),
    alt: "Тихі вихідні собак Curly Joy",
  },
  {
    image: photo("6a02d2e960a7a52fdc244cc5"),
    alt: "Святкуємо день народження Жулі",
  },
] as const;
