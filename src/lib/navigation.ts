import type { InfoRoute } from "@/content/info-pages";

/**
 * Every destination the site chrome may point at. Typed rather than `string`,
 * so a menu entry for a page that does not exist fails the build instead of
 * turning up as a 404 in someone's console.
 */
export type NavHref =
  | "/"
  | "/catalog"
  | "/cart"
  | "/favorites"
  | "/#recommendations"
  | InfoRoute
  | `mailto:${string}`;

export interface NavLink {
  href: NavHref;
  label: string;
}

/** Main menu. One source for the desktop header and the mobile sheet. */
export const headerNav = [
  { href: "/info/about", label: "Про нас" },
  { href: "/#recommendations", label: "Curly Joy рекомендує" },
  { href: "/info/blog", label: "Блог" },
  { href: "/info/events", label: "Події" },
] as const satisfies readonly NavLink[];

/** Service pages, listed in the footer. */
export const infoNav = [
  { href: "/info/about", label: "Про нас" },
  { href: "/info/delivery", label: "Способи доставки" },
  { href: "/info/payment", label: "Умови та способи оплати" },
  { href: "/info/returns", label: "Повернення та обмін" },
  { href: "/info/contacts", label: "Контакти" },
  { href: "/info/terms", label: "Публічна оферта" },
  { href: "/info/cookies", label: "Політика cookie" },
] as const satisfies readonly NavLink[];
