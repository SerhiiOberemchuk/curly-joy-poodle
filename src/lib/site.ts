export interface PaymentMark {
  label: string;
  /**
   * Офіційний файл логотипу в `/public`. Поки його немає, марка малюється
   * текстом — це краще за биту картинку у футері кожної сторінки.
   */
  src?: string;
  width?: number;
  height?: number;
  href?: string;
}

export interface MessengerLink { label: string; href: string }

export const site = {
  name: "Curly Joy Store",
  /** Назва бренду у футері; статус реєстрації торговельної марки тут не стверджується. */
  legalName: "Curly Joy",
  tagline: "Офіційний дистриб'ютор GF Pet в Україні",
  description:
    "Функціональний одяг та аксесуари для собак: охолоджувальні жилети, бандани, килимки, зимові парки та рятувальні жилети GF Pet.",
  url: "https://curly-joy.com",
  locale: "uk_UA",
  phone: "+38 (067) 440-43-94",
  phoneHref: "tel:+380674404394",
  email: "4404394@gmail.com",
  /**
   * Публічна адреса — без номера квартири. Це житло, і виносити його повністю
   * у футер кожної сторінки зайве. Повна адреса є в реквізитах оферти, як
   * того вимагає договір.
   */
  address: "02005, м. Київ, вул. Каховська, 62",
  workingHours: "Пн–Пт, 9:00–18:00",
  /** Add the merchant's real Telegram/Viber/WhatsApp links when supplied. */
  messengers: [] as readonly MessengerLink[],
  socials: [
    { label: "Instagram", href: "https://www.instagram.com/curly_joy_poodle" },
    {
      label: "Facebook",
      href: "https://www.facebook.com/profile.php?id=61586958639272",
    },
  ],
  /**
   * Реквізити продавця. Єдине джерело: сторінки «Публічна оферта» і
   * «Контакти» збирають свої блоки звідси, щоб реквізити не розійшлися.
   */
  legal: {
    entity: "Фізична особа-підприємець Новікова Ніла Віталіївна",
    short: "ФОП Новікова Н. В.",
    taxId: "2928115563",
    fullAddress: "Україна, 02005, м. Київ, вул. Каховська, буд. 62, кв. 109",
    taxStatus:
      "платник єдиного податку третьої групи за ставкою 5 %, без реєстрації платником ПДВ",
    extract: "витяг з реєстру платників єдиного податку № 89237 від 29.06.2026",
  },
} as const;

export const paymentMarks: readonly PaymentMark[] = [
  { label: "Visa" },
  { label: "Mastercard" },
  { label: "Monobank", href: "https://monobank.ua" },
];
