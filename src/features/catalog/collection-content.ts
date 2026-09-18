import type { CollectionGroup } from "./types";

export const collectionBrand = {
  name: "GF PET®",
  title: "З турботою про кожну прогулянку",
  description:
    "GF PET® створює одяг та аксесуари для собак, поєднуючи зручність, практичність і стиль. Від затишних светрів до захисту від дощу та спеки — речі для різної погоди й ваших щоденних пригод разом.",
};

/** Order and membership are editorial data, independent of layout and product names. */
export const collectionGroups: readonly CollectionGroup[] = [
  {
    slug: "sweaters",
    title: "Светри",
    description:
      "Светри GF PET® — для прогулянок у прохолодний день, затишного відпочинку та додаткового шару під куртку. М’який трикотаж зігріває, а зручна посадка залишає свободу рухів.",
    productSlugs: ["elasto-fit-sweater"],
  },
  {
    slug: "parkas",
    title: "Парки",
    description:
      "Теплий верхній одяг для зимових маршрутів. Парки допомагають захиститися від холоду й вітру, а регульована посадка дозволяє підібрати комфортний обхват для вашої собаки.",
    productSlugs: ["winter-parka"],
  },
  {
    slug: "bodysuits",
    title: "Комбінезони",
    description:
      "Для прогулянок, на яких хочеться більше тепла й захисту від мокрого снігу. Комбінезони закривають корпус і лапи та допомагають зберегти шерсть чистішою.",
    productSlugs: ["insulated-bodysuit"],
  },
  {
    slug: "raincoats",
    title: "Дощовики",
    description:
      "Дощ не скасовує ваших планів. Легкі двосторонні дощовики захищають від вологи, а світловідбивні деталі допомагають бути помітнішими на прогулянці.",
    productSlugs: ["reversible-raincoat"],
  },
  {
    slug: "tees",
    title: "Футболки",
    description:
      "Легкий одяг для щоденних виходів і спільних подорожей. Зручний крій та м’які матеріали — для собак, які люблять рухатися й досліджувати.",
    productSlugs: ["graphic-tee"],
  },
  {
    slug: "cooling-wear",
    title: "Охолоджувальні жилети та бандани",
    description:
      "Комфорт у теплу погоду починається з маленьких деталей. Жилети й бандани COOLFRESH™ доповнюють літні прогулянки та поїздки — оберіть формат, зручний саме вашому улюбленцю.",
    productSlugs: ["ice-vest-coolfresh", "ice-band-bandana"],
  },
  {
    slug: "rest-and-play",
    title: "Для відпочинку та ігор",
    description:
      "Після активної прогулянки — час перепочити. Охолоджувальні килимки й іграшки стануть у пригоді вдома, в автомобілі та на відпочинку.",
    productSlugs: ["ice-mat-cooling", "ice-toy-cooling"],
  },
  {
    slug: "safety",
    title: "Безпека поруч",
    description:
      "Амуніція для впевнених прогулянок і пригод біля води. Обирайте за призначенням, а розмір звіряйте із замірами собаки та рекомендаціями до конкретної моделі.",
    productSlugs: ["life-vest", "reflective-harness"],
  },
  {
    slug: "accessories",
    title: "Теплі деталі",
    description:
      "Доповнення до основного гардероба: снуди для шиї та вух, черевики для захисту лап. Невеликі речі, з якими прогулянка стає комфортнішою.",
    productSlugs: ["neck-warmer-snood", "all-weather-boots"],
  },
];
