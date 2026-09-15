/** Owner's original photography; provenance is documented in /docs. */
const asset = (name: string) => `/images/reference/${name}.webp`;

export const homeImages = {
  logo: asset("6a1aff045a3e6e89b6f86151"),
  hero: asset("6a01deeca2398e6af2ca63ab"),
  avatar: asset("bc785218-5cd6-4c77-bce8-f8b861ef4549"),
  allProducts: asset("b3b3a371-d596-4d0e-9b36-3d8006a82fcf"),
  summer: asset("8c922cf1-57f1-44c3-812b-073416497db8"),
  winter: asset("4086b62e-afbf-4862-a22e-8a835308cb96"),
  fit: asset("3f322bef-348d-4417-b8b4-95dd518c7589"),
  values: asset("4ea3d13f-83c7-49cb-ad0f-c1c424a82ab9"),
} as const;

export const summerCategories = [
  {
    slug: "ice-toy-cooling",
    title: "Охолоджувальні іграшки",
    line: "ICE-TOY™",
    image: asset("78bbc1c4-21f8-4f34-acaa-c907d64cdded"),
  },
  {
    slug: "ice-vest-coolfresh",
    title: "Охолоджувальні жилети",
    line: "ICE-VEST®",
    image: asset("f7e24763-4861-4922-929e-288d73a6bae2"),
  },
  {
    slug: "ice-band-bandana",
    title: "Охолоджувальні бандани",
    line: "ICE-BAND®",
    image: asset("5fb4b568-0a97-4678-abdc-f613082c9de6"),
  },
  {
    slug: "ice-mat-cooling",
    title: "Охолоджувальні килимки",
    line: "ICE-MAT®",
    image: asset("d71588ce-85a1-4be3-bc5a-a9ef477a009c"),
  },
  {
    slug: "graphic-tee",
    title: "Футболки",
    line: "GRAPHIC TEE",
    image: asset("e70f281d-ddb3-4cb1-bd98-aebb1d7c9f47"),
  },
  {
    slug: "life-vest",
    title: "Жилети для плавання",
    line: "LIFE VEST",
    image: asset("a990ab67-7b8e-476a-8562-439dcbeb6807"),
  },
] as const;

export const team = [
  {
    role: "Директор з маркетингу",
    description: "Той-пудель, 4 роки",
    image: asset("1a6c80de-51f3-4385-9892-58780cb7b743"),
  },
  {
    role: "Головна модель",
    description: "Мальтіпу, 2 роки",
    image: asset("181c5c9d-df52-4380-b701-4359f7d67e1f"),
  },
  {
    role: "Керівник безпеки",
    description: "Кане-корсо, 6 років",
    image: asset("1bd38c02-f511-4a5c-bcb7-b1fed3832dc4"),
  },
  {
    role: "Робота зі скаргами",
    description: "Бостон-тер’єр, 12 років",
    image: asset("42abe2c1-68ff-4c88-80cb-ec44474db67c"),
  },
  {
    role: "Стажер-модель",
    description: "Боксер, 2 роки",
    image: asset("0bbe5577-abe8-490c-a7e7-0e68918e5760"),
  },
  {
    role: "Офісний «танцюрист»",
    description: "Пудель, 11 років",
    image: asset("911db988-6130-46ca-a3db-e1ff253aa65e"),
  },
] as const;

export const gallery = [
  {
    image: asset("6a02d2e9f07c4898894b8d52"),
    alt: "Луна, Жуля, Даня та Фіфа — знайомтеся з Curly Joy",
  },
  { image: asset("6a02d2e960a7a52fdc244cc4"), alt: "Луна в рожевій футболці" },
  {
    image: asset("6a02d2e982125b98745bb453"),
    alt: "Тихі вихідні наших улюбленців",
  },
  {
    image: asset("6a02d2e9355da19d8c21efc7"),
    alt: "Пуделі на прогулянці — Curly Joy росте",
  },
  {
    image: asset("6a02d2e9355da19d8c21efcb"),
    alt: "Затишний відпочинок пуделя",
  },
  {
    image: asset("6a02d2e9fa8afa3be0b0dfbc"),
    alt: "Пікнік разом з чотирилапими друзями",
  },
  { image: asset("6a02d2e960a7a52fdc244cc5"), alt: "Жулі чотири роки" },
  {
    image: asset("6a02d2e982125b98745bb454"),
    alt: "Чотирилапа компанія Curly Joy на природі",
  },
] as const;
