import "server-only";
import type { Locale } from "@/lib/i18n";
import type { WelcomeOfferDialogCopy } from "./types";

/** Campaign figures the CRM enforces, already formatted for the locale. */
export interface OfferFigures {
  discount: string;
  maxDiscount: string | null;
  minimum: string | null;
  lifetime: string;
  endsAt: string | null;
}

interface WelcomeOfferCopy {
  section: {
    eyebrow: string;
    title: string;
    offer: (figures: OfferFigures) => string;
    community: string;
    communityLink: string;
  };
  dialog: WelcomeOfferDialogCopy;
  offer: {
    title: (figures: OfferFigures) => string;
    terms: (figures: OfferFigures) => string;
    /** Sent to the CRM verbatim as the consent record. */
    consent: string;
  };
  messages: {
    sent: string;
    unavailable: string;
    changed: string;
    rejected: string;
    invalidEmail: string;
    consentRequired: string;
    throttled: string;
    failed: string;
  };
}

const uk: WelcomeOfferCopy = {
  section: {
    eyebrow: "Раді знайомству",
    title: "Ще більше радості разом",
    offer: ({ discount }) =>
      `Залиште email — надішлемо персональний промокод на знижку ${discount} для першого замовлення.`,
    community:
      "Нові знахідки, історії наших хвостиків і натхнення для щасливого життя із собакою. Зустрінемось в Instagram?",
    communityLink: "До нашої спільноти",
  },
  dialog: {
    open: "Пропозиція для першого замовлення",
    close: "Закрити пропозицію",
    eyebrow: "Для першого знайомства",
    hint: "Отримайте персональний промокод на email. Створювати обліковий запис не потрібно.",
    email: "Ваш email",
    submit: "Отримати промокод",
    pending: "Надсилаємо…",
  },
  offer: {
    title: ({ discount }) => `−${discount} на перше замовлення`,
    terms: ({ lifetime, endsAt, minimum, maxDiscount }) =>
      [
        `Промокод діє ${lifetime} після надсилання листа${endsAt ? `, але не довше ніж до ${endsAt}` : ""}.`,
        minimum && `Мінімальна сума замовлення — ${minimum}.`,
        maxDiscount && `Знижка — не більше ${maxDiscount}.`,
        "Застосуйте код з тим самим email, на який він прийде.",
      ]
        .filter(Boolean)
        .join(" "),
    consent:
      "Погоджуюся, щоб Curly Joy зберіг мій email і надіслав на нього персональний промокод для першого замовлення.",
  },
  messages: {
    sent: "Перевірте пошту: якщо пропозиція доступна для цієї адреси, лист із промокодом уже в дорозі. Використайте той самий email під час оформлення.",
    unavailable: "Пропозиція зараз недоступна. Спробуйте пізніше.",
    changed:
      "Умови пропозиції оновилися. Перегляньте їх і надішліть запит ще раз.",
    rejected: "Не вдалося надіслати запит.",
    invalidEmail: "Вкажіть коректний email.",
    consentRequired: "Потрібна згода на обробку email для цієї пропозиції.",
    throttled: "Забагато спроб. Зачекайте кілька хвилин і спробуйте ще раз.",
    failed: "Не вдалося завершити запит. Спробуйте ще раз пізніше.",
  },
};

export const welcomeOfferCopy: Record<Locale, WelcomeOfferCopy> = { uk };
