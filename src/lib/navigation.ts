export interface NavLink {
  href: string;
  label: string;
}

export const primaryNav: readonly NavLink[] = [
  { href: "/catalog", label: "Каталог" },
  { href: "/#moments", label: "Добірки для життя" },
  { href: "/#recommendations", label: "Curly Joy рекомендує" },
  { href: "/#story", label: "Про Curly Joy" },
  { href: "/info/sizes", label: "Як виміряти" },
];

export const infoNav: readonly NavLink[] = [
  { href: "/info/delivery", label: "Способи доставки" },
  { href: "/info/payment", label: "Умови та способи оплати" },
  { href: "/info/returns", label: "Повернення та обмін" },
  { href: "/info/terms", label: "Публічна оферта" },
  { href: "/info/cookies", label: "Політика cookie" },
];
