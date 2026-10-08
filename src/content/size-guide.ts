export type SizeCode = "XXS" | "XS" | "S" | "M" | "L" | "XL" | "XXL";

export interface SizeGuideRow {
  /** Size label shown to the customer. */
  code: SizeCode;
  /** Back length (withers to tail base), cm. */
  backLengthCm: [number, number];
  /** Chest girth, cm. */
  chestCm: [number, number];
  /** Typical breeds for this size — the fastest way for a customer to self-select. */
  breeds: string;
}

/** Shown on /info/sizes. Editorial content, not catalog data. */
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
