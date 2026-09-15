export interface NavLink {
  href: string;
  label: string;
}

export const primaryNav: readonly NavLink[] = [
  { href: "/catalog", label: "Каталог" },
  { href: "/collection/summer", label: "Літня колекція" },
  { href: "/collection/winter", label: "Зимова колекція" },
  { href: "/info/sizes", label: "Як виміряти" },
];

export const infoNav: readonly NavLink[] = [
  { href: "/info/delivery", label: "Способи доставки" },
  { href: "/info/payment", label: "Умови та способи оплати" },
  { href: "/info/returns", label: "Повернення та обмін" },
  { href: "/info/terms", label: "Публічна оферта" },
  { href: "/info/cookies", label: "Політика cookie" },
];
