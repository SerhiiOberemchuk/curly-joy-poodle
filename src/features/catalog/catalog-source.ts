import type {
  Category,
  CollectionInfo,
  Product,
  ProductVariant,
  SizeCode,
  SizeGuideRow,
} from "./types";

/**
 * Single source of truth for the catalog while the store runs on seed data.
 * Everything above this module reads through `./queries`, so swapping this for a
 * CMS or the SalesDrive API stays a one-file change.
 */

const DEFAULT_STOCK = 12;

interface VariantOptions {
  compareAtPrice?: number;
  soldOut?: readonly SizeCode[];
}

function buildVariants(
  skuPrefix: string,
  price: number,
  sizes: readonly SizeCode[],
  { compareAtPrice, soldOut = [] }: VariantOptions = {},
): ProductVariant[] {
  return sizes.map((size) => ({
    sku: `${skuPrefix}-${size}`,
    size,
    price,
    compareAtPrice,
    stock: soldOut.includes(size) ? 0 : DEFAULT_STOCK,
  }));
}

const APPAREL_SIZES: readonly SizeCode[] = ["XS", "S", "M", "L", "XL"];
const EXTENDED_SIZES: readonly SizeCode[] = [
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
];
const ONE_SIZE: readonly SizeCode[] = ["S", "M", "L"];

export const categories: readonly Category[] = [
  {
    slug: "travel",
    title: "Подорожуємо разом",
    tagline: "Найкращий попутник уже зібрався",
    description:
      "Усе для комфортних і безпечних поїздок, відпочинку біля води та нових пригод із собакою.",
    accent: "sky",
    glyph: "🧳",
    productSlugs: ["life-vest", "ice-mat-cooling", "ice-band-bandana", "ice-toy-cooling", "reversible-raincoat"],
  },
  {
    slug: "walks",
    title: "Гуляємо та досліджуємо",
    tagline: "Для знайомих стежок і нових маршрутів",
    description:
      "Амуніція, одяг і захист для щоденних прогулянок та маленьких відкриттів разом.",
    accent: "mint",
    glyph: "🐕",
    productSlugs: ["graphic-tee", "reversible-raincoat", "reflective-harness", "all-weather-boots", "ice-band-bandana"],
  },
  {
    slug: "feeding",
    title: "Їмо з задоволенням",
    tagline: "Смачні ритуали щодня",
    description: "Корм, смаколики, миски та корисні дрібниці для приємних щоденних ритуалів.",
    accent: "accent",
    glyph: "🥣",
    productSlugs: [],
  },
  {
    slug: "grooming",
    title: "Доглядаємо з любов’ю",
    tagline: "Турбота, яку видно",
    description: "Краса, гігієна та доглядові засоби для собак і затишних домашніх процедур.",
    accent: "accent",
    glyph: "🫧",
    productSlugs: [],
  },
  {
    slug: "health",
    title: "Здоров’я та перша допомога",
    tagline: "Спокій у важливих ситуаціях",
    description: "Аптечки, сезонний захист та корисні речі, які допомагають дбати про самопочуття собаки.",
    accent: "mint",
    glyph: "🩹",
    productSlugs: [],
  },
  {
    slug: "toys",
    title: "Тренуємось та граємо",
    tagline: "Більше руху, радості й цікавості",
    description: "Іграшки та речі для активності, тренувань і спільних веселих моментів.",
    accent: "sky",
    glyph: "🧸",
    productSlugs: ["ice-toy-cooling"],
  },
  {
    slug: "at-home",
    title: "Відпочиваємо вдома",
    tagline: "Щастя — коли можна просто бути поруч",
    description: "Речі для домашніх ігор, затишного відпочинку та улюбленого куточка.",
    accent: "accent",
    glyph: "🏠",
    productSlugs: ["ice-mat-cooling", "ice-toy-cooling"],
  },
  {
    slug: "gifts",
    title: "Ідеї для подарунків",
    tagline: "Для собак і для pet parents",
    description: "Речі, якими приємно порадувати собаку, її людину або обох одразу.",
    accent: "accent",
    glyph: "🎁",
    productSlugs: ["graphic-tee", "ice-toy-cooling", "ice-band-bandana", "neck-warmer-snood"],
  },
];

export const collections: readonly CollectionInfo[] = [
  {
    slug: "walks",
    title: "Гуляємо",
    tagline: "Ваші моменти разом",
    description:
      "Одяг та аксесуари для знайомих стежок, довгих маршрутів і щоденних маленьких відкриттів.",
    accent: "mint",
    glyph: "",
    productSlugs: [
      "graphic-tee",
      "reversible-raincoat",
      "reflective-harness",
      "all-weather-boots",
      "ice-band-bandana",
    ],
  },
  {
    slug: "travel",
    title: "Подорожуємо разом",
    tagline: "Найкращий попутник уже зібрався",
    description:
      "Добірка для спільних виїздів за місто, відпочинку біля води та нових пригод із собакою.",
    accent: "sky",
    glyph: "",
    productSlugs: [
      "life-vest",
      "ice-mat-cooling",
      "ice-band-bandana",
      "ice-toy-cooling",
      "reversible-raincoat",
    ],
  },
  {
    slug: "at-home",
    title: "Відпочиваємо вдома",
    tagline: "Щастя — коли можна просто бути поруч",
    description: "Речі для домашніх ігор та відпочинку в улюбленому куточку.",
    accent: "accent",
    glyph: "",
    productSlugs: ["ice-mat-cooling", "ice-toy-cooling"],
  },
  {
    slug: "dress-up",
    title: "Одягаємось",
    tagline: "Для будь-якої погоди. І власного настрою",
    description:
      "Футболки, дощовики та теплий одяг для комфортних прогулянок у різні пори року.",
    accent: "accent",
    glyph: "",
    productSlugs: [
      "graphic-tee",
      "reversible-raincoat",
      "winter-parka",
      "elasto-fit-sweater",
      "insulated-bodysuit",
      "neck-warmer-snood",
      "all-weather-boots",
    ],
  },
  {
    slug: "curly-joy-recommends",
    title: "Curly Joy рекомендує",
    tagline: "З любов’ю до деталей",
    description:
      "Наш вибір речей для спільних прогулянок, ігор та подорожей із собакою.",
    accent: "accent",
    glyph: "",
    productSlugs: [
      "ice-band-bandana",
      "ice-toy-cooling",
      "graphic-tee",
      "life-vest",
    ],
  },
  {
    slug: "summer",
    title: "Літня колекція",
    tagline: "Тепер мені завжди буде комфортно",
    description:
      "Охолоджувальні жилети, бандани та килимки на технології COOLFRESH™ — щоб спека не скорочувала прогулянки й не тримала собаку вдома до заходу сонця.",
    accent: "sky",
    glyph: "☀️",
  },
  {
    slug: "winter",
    title: "Зимова колекція",
    tagline: "Мороз, сніг і реагенти — не привід скоротити маршрут",
    description:
      "Парки, комбінезони та светри з мембраною й утеплювачем. Тримають тепло до −20 °C і залишаються сухими після мокрого снігу.",
    accent: "accent",
    glyph: "❄️",
  },
  {
    slug: "all-season",
    title: "Позасезонні",
    tagline: "Працює і в жовтні, і в квітні",
    description:
      "Дощовики та світловідбивна амуніція, які живуть у передпокої цілий рік.",
    accent: "mint",
    glyph: "🌦️",
  },
];

export const sizeGuide: readonly SizeGuideRow[] = [
  {
    code: "XXS",
    backLengthCm: [20, 25],
    chestCm: [28, 34],
    breeds: "Чихуахуа, той-тер’єр",
  },
  {
    code: "XS",
    backLengthCm: [25, 30],
    chestCm: [34, 41],
    breeds: "Той-пудель, йоркширський тер’єр",
  },
  {
    code: "S",
    backLengthCm: [30, 36],
    chestCm: [41, 49],
    breeds: "Мальтіпу, шпіц, джек-рассел",
  },
  {
    code: "M",
    backLengthCm: [36, 43],
    chestCm: [49, 58],
    breeds: "Міні-пудель, фокстер’єр, бігль",
  },
  {
    code: "L",
    backLengthCm: [43, 51],
    chestCm: [58, 69],
    breeds: "Кокер-спанієль, бордер-колі",
  },
  {
    code: "XL",
    backLengthCm: [51, 60],
    chestCm: [69, 82],
    breeds: "Лабрадор, австралійська вівчарка",
  },
  {
    code: "XXL",
    backLengthCm: [60, 70],
    chestCm: [82, 96],
    breeds: "Вівчарка, ретривер, кане-корсо",
  },
];

export const products: readonly Product[] = [
  {
    id: "p-ice-vest",
    slug: "ice-vest-coolfresh",
    title: "Охолоджувальний жилет",
    line: "ICE-VEST®",
    brand: "GF Pet",
    categorySlug: "cooling",
    collection: "summer",
    summary:
      "Тришарова тканина COOLFRESH™ тримає прохолоду до 4 годин після одного змочування.",
    description:
      "ICE-VEST® — базовий шар літнього гардеробу. Зовнішній шар відбиває сонце, середній утримує вологу, внутрішній контактує зі шкірою та забирає тепло. Жилет не важчає після намокання й не обмежує рух лопаток, тож собака працює у звичному темпі навіть у +30 °C.",
    features: [
      "Знижує температуру тіла на 3–5 °C",
      "Світловідбивна окантовка по периметру",
      "Отвір під повідець сумісний із шлеєю",
      "Регульовані застібки на грудях і животі",
    ],
    care: [
      "Прання вручну при 30 °C",
      "Не використовувати кондиціонер для білизни",
      "Сушити в розправленому вигляді",
    ],
    badges: ["Хіт продажів", "COOLFRESH™"],
    images: [
      {
        src: "/images/reference/f7e24763-4861-4922-929e-288d73a6bae2.webp",
        from: "#dbeafe",
        to: "#93c5fd",
        glyph: "🧊",
        alt: "Охолоджувальний жилет ICE-VEST на собаці",
      },
    ],
    variants: buildVariants("ICE-VEST", 129000, EXTENDED_SIZES, {
      soldOut: ["XXS"],
    }),
  },
  {
    id: "p-ice-band",
    slug: "ice-band-bandana",
    title: "Охолоджувальна бандана",
    line: "ICE-BAND®",
    brand: "GF Pet",
    categorySlug: "cooling",
    collection: "summer",
    summary:
      "Охолоджує сонну артерію — найшвидший спосіб збити перегрів на прогулянці.",
    description:
      "Бандана працює там, де кров проходить найближче до поверхні шкіри, тому ефект відчутний уже за кілька хвилин. Компактна: вміщується в кишеню й змочується з будь-якої питної пляшки.",
    features: [
      "Тримає прохолоду до 3 годин",
      "Застібка на липучці, регулюється однією рукою",
      "Не фарбує шерсть",
    ],
    care: ["Прання вручну при 30 °C", "Сушити горизонтально"],
    badges: ["COOLFRESH™"],
    images: [
      {
        src: "/images/reference/5fb4b568-0a97-4678-abdc-f613082c9de6.webp",
        from: "#ccfbf1",
        to: "#5eead4",
        glyph: "🧣",
        alt: "Охолоджувальна бандана ICE-BAND",
      },
    ],
    variants: buildVariants("ICE-BAND", 59000, ONE_SIZE),
  },
  {
    id: "p-ice-mat",
    slug: "ice-mat-cooling",
    title: "Охолоджувальний килимок",
    line: "ICE-MAT®",
    brand: "GF Pet",
    categorySlug: "cooling",
    collection: "summer",
    summary:
      "Гелевий килимок активується вагою собаки — без холодильника й електрики.",
    description:
      "Килимок для дому, авто та переноски. Гель усередині реагує на тиск і починає віддавати прохолоду одразу, а відновлюється самостійно за 15–20 хвилин без навантаження.",
    features: [
      "Автоматична активація від ваги",
      "Нековзке дно",
      "Витримує до 60 кг",
      "Складається вдвічі",
    ],
    care: [
      "Протирати вологою серветкою",
      "Не прати в машинці",
      "Зберігати в розправленому вигляді",
    ],
    badges: ["Для авто"],
    images: [
      {
        src: "/images/reference/d71588ce-85a1-4be3-bc5a-a9ef477a009c.webp",
        from: "#e0e7ff",
        to: "#a5b4fc",
        glyph: "🛏️",
        alt: "Охолоджувальний килимок ICE-MAT",
      },
    ],
    variants: buildVariants("ICE-MAT", 149000, ["S", "M", "L", "XL"], {
      soldOut: ["XL"],
    }),
  },
  {
    id: "p-ice-toy",
    slug: "ice-toy-cooling",
    title: "Охолоджувальна іграшка",
    line: "ICE-TOY™",
    brand: "GF Pet",
    categorySlug: "cooling",
    collection: "summer",
    summary:
      "Замочіть, заморозьте, віддайте — заспокоює ясна цуценяти й тримає в тіні.",
    description:
      "Іграшка вбирає воду, а після морозильної камери перетворюється на охолоджувальний гризунець. Зручна для цуценят у період зміни зубів і для дорослих собак у спеку.",
    features: [
      "Безпечний харчовий матеріал",
      "Тримає форму після заморозки",
      "Плаває у воді",
    ],
    care: ["Мити теплою водою", "Повністю просушувати перед зберіганням"],
    badges: ["Новинка"],
    images: [
      {
        src: "/images/reference/78bbc1c4-21f8-4f34-acaa-c907d64cdded.webp",
        from: "#fef3c7",
        to: "#fcd34d",
        glyph: "🦴",
        alt: "Охолоджувальна іграшка ICE-TOY",
      },
    ],
    variants: buildVariants("ICE-TOY", 39000, ["S", "M"]),
  },
  {
    id: "p-graphic-tee",
    slug: "graphic-tee",
    title: "Футболка Graphic Tee",
    brand: "GF Pet",
    categorySlug: "apparel",
    collection: "summer",
    summary: "Легкий бавовняний шар проти сонця, пилку та подряпин від кущів.",
    description:
      "Футболка з органічної бавовни з еластаном. Захищає світлу шкіру від сонця, а після грумінгу — від пилу. Не витягується після прання й тримає форму горловини.",
    features: [
      "95% бавовна / 5% еластан",
      "Крій Elasto-Fit®",
      "Принт, стійкий до прання",
    ],
    care: ["Машинне прання 30 °C", "Не відбілювати", "Прасувати з вивороту"],
    badges: [],
    images: [
      {
        src: "/images/reference/e70f281d-ddb3-4cb1-bd98-aebb1d7c9f47.webp",
        from: "#fee2e2",
        to: "#fca5a5",
        glyph: "👕",
        alt: "Футболка Graphic Tee для собак",
      },
    ],
    variants: buildVariants("TEE", 69000, APPAREL_SIZES, {
      compareAtPrice: 89000,
    }),
  },
  {
    id: "p-life-vest",
    slug: "life-vest",
    title: "Рятувальний жилет",
    line: "LIFE VEST",
    brand: "GF Pet",
    categorySlug: "safety",
    collection: "summer",
    summary:
      "Тримає собаку на плаву горизонтально — так, як вона пливе природно.",
    description:
      "Жилет із рівномірно розподіленою плавучістю: голова залишається над водою, а корпус не перевертає. Посилена ручка витримує вагу дорослої собаки — можна підняти на борт човна однією рукою.",
    features: [
      "Ручка для підйому з води",
      "Світловідбивні панелі 360°",
      "Швидкороз’ємні пряжки",
      "Кільце для короткого повідця",
    ],
    care: ["Промивати прісною водою після моря", "Сушити в тіні"],
    badges: ["Безпека на воді"],
    images: [
      {
        src: "/images/reference/a990ab67-7b8e-476a-8562-439dcbeb6807.webp",
        from: "#fed7aa",
        to: "#fb923c",
        glyph: "🦺",
        alt: "Рятувальний жилет для собак",
      },
    ],
    variants: buildVariants("LIFE", 169000, APPAREL_SIZES),
  },
  {
    id: "p-winter-parka",
    slug: "winter-parka",
    title: "Зимова парка",
    brand: "GF Pet",
    categorySlug: "apparel",
    collection: "winter",
    summary:
      "Утеплювач до −20 °C, мембрана 5000 мм і капюшон, що не з’їжджає на очі.",
    description:
      "Парка для довгих зимових прогулянок. Мембранна тканина не пропускає вологу ззовні, але виводить пару зсередини, тож собака не пітніє під час активного руху. Подовжена спинка закриває поперек.",
    features: [
      "Водостійкість 5000 мм",
      "Синтетичний утеплювач 180 г/м²",
      "Подовжена спинка та висока горловина",
      "Світловідбивні канти",
    ],
    care: [
      "Машинне прання 30 °C",
      "Не прасувати мембрану",
      "Сушити в розправленому вигляді",
    ],
    badges: ["Зима −20 °C"],
    images: [
      {
        from: "#e2e8f0",
        to: "#94a3b8",
        glyph: "🧥",
        alt: "Зимова парка для собак",
      },
      {
        from: "#f1f5f9",
        to: "#cbd5e1",
        glyph: "❄️",
        alt: "Парка на зимовій прогулянці",
      },
    ],
    variants: buildVariants("PARKA", 229000, EXTENDED_SIZES, {
      soldOut: ["XXL"],
    }),
  },
  {
    id: "p-reversible-raincoat",
    slug: "reversible-raincoat",
    title: "Двосторонній дощовик",
    brand: "GF Pet",
    categorySlug: "apparel",
    collection: "all-season",
    summary: "Один бік яскравий для видимості, другий — спокійний для міста.",
    description:
      "Дощовик із проклеєними швами та капюшоном, що складається в комір. Вивертається за секунди: неоновий бік для сутінків і приглушений — для щоденних виходів.",
    features: [
      "Проклеєні шви",
      "Капюшон ховається в комір",
      "Отвір під повідець",
      "Пакується в кишеню",
    ],
    care: ["Машинне прання 30 °C", "Не віджимати"],
    badges: ["2 в 1"],
    images: [
      {
        from: "#fef9c3",
        to: "#fde047",
        glyph: "🌧️",
        alt: "Двосторонній дощовик для собак",
      },
      {
        from: "#ecfccb",
        to: "#bef264",
        glyph: "🐕‍🦺",
        alt: "Дощовик, вивернутий на інший бік",
      },
    ],
    variants: buildVariants("RAIN", 189000, APPAREL_SIZES),
  },
  {
    id: "p-knit-sweater",
    slug: "elasto-fit-sweater",
    title: "Светр Elasto-Fit®",
    brand: "GF Pet",
    categorySlug: "apparel",
    collection: "winter",
    summary:
      "Щільна в’язка з еластичними вставками — тепло без ефекту гамівної сорочки.",
    description:
      "Базовий светр для міжсезоння та як шар під парку. Еластичні вставки в зонах лопаток і стегон дозволяють повний обсяг руху, а манжети не задираються під час бігу.",
    features: [
      "Вставки Elasto-Fit® у зонах руху",
      "Не колеться — без вовни в складі",
      "Тримає форму після 50 прань",
    ],
    care: ["Машинне прання 30 °C, делікатний режим", "Сушити горизонтально"],
    badges: [],
    images: [
      {
        from: "#fae8ff",
        to: "#e9d5ff",
        glyph: "🧶",
        alt: "Светр Elasto-Fit для собак",
      },
    ],
    variants: buildVariants("SWTR", 119000, EXTENDED_SIZES),
  },
  {
    id: "p-insulated-bodysuit",
    slug: "insulated-bodysuit",
    title: "Утеплений комбінезон",
    brand: "GF Pet",
    categorySlug: "apparel",
    collection: "winter",
    summary:
      "Закриває лапи й живіт — для порід, які після прогулянки їдуть у ванну.",
    description:
      "Повний комбінезон для мокрого снігу та реагентів. Закриті штанини тримають живіт і лапи сухими, а водовідштовхувальне покриття не дає бруду в’їдатися в тканину.",
    features: [
      "Закриті штанини",
      "Двобічна змійка вздовж спини",
      "Водовідштовхувальне покриття DWR",
      "Захист від реагентів",
    ],
    care: ["Машинне прання 30 °C", "Оновлювати DWR раз на сезон"],
    badges: ["Зима −20 °C"],
    images: [
      {
        from: "#dbeafe",
        to: "#60a5fa",
        glyph: "🩱",
        alt: "Утеплений комбінезон для собак",
      },
      {
        from: "#e0f2fe",
        to: "#7dd3fc",
        glyph: "🌨️",
        alt: "Комбінезон у мокрому снігу",
      },
    ],
    variants: buildVariants("SUIT", 259000, APPAREL_SIZES),
  },
  {
    id: "p-neck-warmer",
    slug: "neck-warmer-snood",
    title: "Снуд-комір",
    brand: "GF Pet",
    categorySlug: "accessories",
    collection: "winter",
    summary:
      "Закриває вуха вислоухим породам і не дає снігу набиватися під комір.",
    description:
      "Флісовий снуд для собак, які мерзнуть шиєю та вухами. Надягається через голову, не тисне на трахею й не заважає нашийнику.",
    features: [
      "Двошаровий фліс",
      "Не тисне на трахею",
      "Сумісний із нашийником",
    ],
    care: ["Машинне прання 30 °C"],
    badges: [],
    images: [
      {
        from: "#f3e8ff",
        to: "#d8b4fe",
        glyph: "🧣",
        alt: "Снуд-комір для собак",
      },
    ],
    variants: buildVariants("SNOOD", 49000, ONE_SIZE),
  },
  {
    id: "p-boots",
    slug: "all-weather-boots",
    title: "Черевики All-Weather",
    brand: "GF Pet",
    categorySlug: "accessories",
    collection: "winter",
    summary:
      "Захист подушечок від реагентів узимку та від розпеченого асфальту влітку.",
    description:
      "Комплект із чотирьох черевиків із рифленою підошвою. Подвійна фіксація на липучках тримає взуття навіть у глибокому снігу, а гнучка підошва дає собаці відчувати поверхню.",
    features: [
      "Комплект 4 шт.",
      "Нековзка рифлена підошва",
      "Подвійна фіксація",
      "Світловідбивна смуга",
    ],
    care: ["Мити теплою водою", "Сушити при кімнатній температурі"],
    badges: ["Комплект 4 шт."],
    images: [
      {
        from: "#ffe4e6",
        to: "#fda4af",
        glyph: "🥾",
        alt: "Черевики All-Weather для собак",
      },
    ],
    variants: buildVariants("BOOT", 139000, ["XS", "S", "M", "L"], {
      soldOut: ["XS"],
    }),
  },
  {
    id: "p-reflective-harness",
    slug: "reflective-harness",
    title: "Світловідбивна шлея",
    brand: "GF Pet",
    categorySlug: "safety",
    collection: "all-season",
    summary:
      "Помітна за 150 метрів у світлі фар — для прогулянок до і після роботи.",
    description:
      "Шлея з широкими світловідбивними стрічками та м’якою підкладкою в зоні грудей. Розподіляє навантаження по корпусу замість тиску на шию — базова вимога для собак із проблемами трахеї.",
    features: [
      "Помітність до 150 м",
      "М’яка підкладка в зоні грудей",
      "Чотири точки регулювання",
      "Посилене кільце для повідця",
    ],
    care: ["Прання вручну при 30 °C"],
    badges: ["Для темної пори"],
    images: [
      {
        from: "#d9f99d",
        to: "#a3e635",
        glyph: "🦮",
        alt: "Світловідбивна шлея для собак",
      },
      { from: "#ecfccb", to: "#bef264", glyph: "🌙", alt: "Шлея у світлі фар" },
    ],
    variants: buildVariants("HARN", 99000, APPAREL_SIZES),
  },
];
