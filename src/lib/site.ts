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

export const site = {
  name: "Curly Joy Store",
  /** Торгова марка. Саме вона стоїть у © футера — реквізити ФОП живуть у `legal`. */
  legalName: "Curly Joy",
  tagline: "Офіційний дистриб'ютор GF Pet в Україні",
  description:
    "Функціональний одяг та аксесуари для собак: охолоджувальні жилети, бандани, килимки, зимові парки та рятувальні жилети GF Pet.",
  url: "https://curly-joy.com",
  locale: "uk_UA",
  phone: "+38 (067) 440-43-94",
  phoneHref: "tel:+380674404394",
  email: "hello@curly-joy.com",
  /**
   * Публічна адреса — без номера квартири. Це житло, і виносити його повністю
   * у футер кожної сторінки зайве. Повна адреса є в реквізитах оферти, як
   * того вимагає договір.
   */
  address: "02005, м. Київ, вул. Каховська, 62",
  workingHours: "Пн–Пт, 9:00–18:00",
  socials: [
    { label: "Instagram", href: "https://www.instagram.com/curly_joy_poodle" },
    { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61586958639272" },
  ],
  /**
   * Реквізити продавця. LiqPay вимагає їх на сайті, а оферта без них — це
   * текст, а не договір. Єдине джерело: сторінки «Публічна оферта» і
   * «Контакти» збирають свої блоки звідси, щоб реквізити не розійшлися.
   */
  legal: {
    entity: "Фізична особа-підприємець Новікова Ніла Віталіївна",
    short: "ФОП Новікова Н. В.",
    taxId: "2928115563",
    fullAddress: "Україна, 02005, м. Київ, вул. Каховська, буд. 62, кв. 109",
    taxStatus: "платник єдиного податку третьої групи за ставкою 5 %, без реєстрації платником ПДВ",
    extract: "витяг з реєстру платників єдиного податку № 89237 від 29.06.2026",
  },
} as const;

/**
 * Платіжні марки у футері. Логотип LiqPay на сайті — пряма вимога мерчант-
 * політики LiqPay: покладіть офіційний файл з брендбуку в
 * `public/images/payments/liqpay.svg` і додайте сюди `src` з розмірами.
 */
export const paymentMarks: readonly PaymentMark[] = [
  { label: "Visa" },
  { label: "Mastercard" },
  { label: "LiqPay", href: "https://www.liqpay.ua" },
];
