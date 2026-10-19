import "server-only";
import type { Locale } from "@/lib/i18n";

interface SocialProofCopy {
  stats: {
    label: string;
    ratingLabel: (average: number) => string;
    average: (average: number) => string;
    reviews: (count: number) => string;
    customers: (count: number) => string;
    customersText: string;
  };
  reviews: {
    eyebrow: string;
    title: string;
    intro: string;
    instagram: string;
    list: string;
    verified: string;
    footnote: string;
    ratingLabel: (rating: number) => string;
    date: (iso: string) => string;
  };
  instagram: {
    eyebrow: string;
    title: string;
    list: string;
    follow: (followers: number | null) => string;
  };
}

const ukPlural = (count: number, one: string, few: string, many: string) => {
  const form = new Intl.PluralRules("uk").select(count);
  return form === "one" ? one : form === "few" ? few : many;
};
const ukCount = new Intl.NumberFormat("uk");
const ukAverage = new Intl.NumberFormat("uk", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const ukCompact = new Intl.NumberFormat("uk", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const ukDate = new Intl.DateTimeFormat("uk", {
  dateStyle: "long",
  timeZone: "Europe/Kyiv",
});

const uk: SocialProofCopy = {
  stats: {
    label: "Нам довіряють",
    ratingLabel: (average) => `Оцінка ${ukAverage.format(average)} з 5`,
    average: (average) => `${ukAverage.format(average)} з 5`,
    reviews: (count) =>
      `${ukCount.format(count)} ${ukPlural(count, "відгук", "відгуки", "відгуків")}`,
    customers: (count) => `${ukCount.format(count)}+`,
    customersText: "задоволених клієнтів",
  },
  reviews: {
    eyebrow: "Curly Joy — для життя разом",
    title: "Враження покупців",
    intro: "Дізнайтеся, як покупці оцінюють товари Curly Joy.",
    instagram: "Більше історій в Instagram",
    list: "Відгуки покупців",
    verified: "Покупку підтверджено",
    footnote: "У кожного хвостика — своя історія.",
    ratingLabel: (rating) => `Оцінка ${rating} з 5`,
    date: (iso) => ukDate.format(new Date(iso)),
  },
  instagram: {
    eyebrow: "З любов’ю від покупців",
    title: "Що нам пишуть в Instagram",
    list: "Скріни відгуків з Instagram",
    follow: (followers) => {
      if (followers === null) return "Ми в Instagram";
      // A compact figure («12,4 тис.») always takes the genitive plural.
      const noun =
        followers >= 1_000
          ? "підписників"
          : ukPlural(followers, "підписник", "підписники", "підписників");
      return `Ми в Instagram · ${ukCompact.format(followers)} ${noun}`;
    },
  },
};

export const socialProofCopy: Record<Locale, SocialProofCopy> = { uk };
